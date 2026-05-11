import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { incrementRequests } from "@/lib/keys";
import { selectProvider, getFallbackProvider, selectCascadeProviders } from "@/lib/routing";
import type { RoutingHints } from "@/lib/routing";
import { streamChat } from "@/lib/stream";
import { collectAnthropicResponse } from "@/lib/providers/anthropic";
import { recordCompletionEpoch } from "@/lib/completion";
import { maybeRebalance } from "@/lib/rebalance";
import { checkRateLimitAsync } from "@/lib/ratelimit";
import { estimateTokens } from "@/lib/tokens";
import { log } from "@/lib/log";
import {
  checkBudget,
  recordSpend,
  estimateCostUsd,
  estimateCostSats,
  releaseReserve,
  incrementFreeQuotaUsage,
  quotaTier,
} from "@/lib/budget";
import { recordRequest } from "@/lib/metrics";
import { buildInvoiceLinks } from "@/lib/invoice-links";
import type { ChatMessage, Provider } from "@/lib/providers";
import { createHash } from "crypto";
import { getOrInitSettlement } from "@/lib/settlement";
import { storePendingInvoice } from "@/lib/invoices";
import { scoreConfidence, buildEscalationPrompt, DEFAULT_CASCADE_THRESHOLD, DEFAULT_CASCADE_MAX_DEPTH } from "@/lib/cascade";
import { recordCascade } from "@/lib/cascade-metrics";
import { createReviewTask, waitForReview } from "@/lib/marketplace";
import { createReceiptToken, sha256Hex } from "@/lib/receipts";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "https://pura.xyz,https://api.pura.xyz").split(",").map((s) => s.trim());

function corsOrigin(request: Request): string {
  const origin = request.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // Allow any origin in development
  if (process.env.NODE_ENV === "development") return origin || "*";
  return ALLOWED_ORIGINS[0];
}

function buildCorsHeaders(request: Request) {
  return {
    "Access-Control-Allow-Origin": corsOrigin(request),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Provider-Key",
    "Access-Control-Expose-Headers":
      "X-Pura-Provider, X-Pura-Capacity, X-Pura-Request-Id, X-Pura-Model, X-Pura-Cost, X-Pura-Budget-Remaining, X-Pura-Routed, X-Pura-Tier, X-Pura-Quality, X-Pura-Explored, X-Pura-Experimental, X-Pura-Cascade-Depth, X-Pura-Cascade-Savings, X-Pura-Confidence, X-Pura-Proof-Class, X-Pura-Proof-Issuer, X-Pura-Quota-Period, X-Pura-Quota-Remaining, X-Pura-Receipt, X-RateLimit-Remaining",
  };
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: buildCorsHeaders(request) });
}

async function createFundingInvoice(origin: string, keyHash: string, amountSats = 10_000) {
  const settlement = await getOrInitSettlement();
  if (!settlement) return null;

  try {
    const invoice = await settlement.createInvoice(keyHash, amountSats, "Pura gateway funding");
    await storePendingInvoice({
      id: invoice.id,
      keyHash,
      amount: invoice.amount,
      rail: settlement.name,
      paymentRequest: invoice.paymentRequest,
      expiresAt: invoice.expiresAt,
    });
    const links = buildInvoiceLinks(origin, invoice.id, invoice.paymentRequest);
    return {
      paymentRequest: invoice.paymentRequest,
      amount: invoice.amount,
      expiresAt: invoice.expiresAt,
      rail: settlement.name,
      invoiceId: invoice.id,
      invoiceUrl: links.invoiceUrl,
      statusUrl: links.statusUrl,
      lightningUrl: links.lightningUrl,
    };
  } catch (error) {
    log.warn("wallet.invoice_create_failed", {
      keyHash: keyHash.slice(0, 8),
      amountSats,
      error: (error as Error).message,
    });
    return null;
  }
}

function withUsageFinalizer(
  stream: ReadableStream<Uint8Array>,
  finalize: () => Promise<void>,
): ReadableStream<Uint8Array> {
  const reader = stream.getReader();
  let finalized = false;

  async function runFinalize() {
    if (finalized) return;
    finalized = true;
    await finalize();
  }

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          await runFinalize();
          controller.close();
          return;
        }
        if (value) controller.enqueue(value);
      } catch (error) {
        await runFinalize();
        controller.error(error);
      }
    },
    async cancel(reason) {
      await runFinalize();
      await reader.cancel(reason);
    },
  });
}

/**
 * Collect full text content from an SSE stream (OpenAI format).
 * Returns the assembled completion text.
 */
async function collectStreamContent(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let content = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return content;
      try {
        const chunk = JSON.parse(payload);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) content += delta;
      } catch {
        // skip malformed chunks
      }
    }
  }

  return content;
}

export async function POST(request: Request) {
  const CORS_HEADERS = buildCorsHeaders(request);
  const requestId = crypto.randomUUID();
  const startMs = Date.now();
  const origin = new URL(request.url).origin;

  // --- Auth ---
  const auth = await authenticate(request.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json(
      { error: { message: auth.error } },
      { status: 401, headers: CORS_HEADERS },
    );
  }
  const raw = request.headers.get("authorization")!.slice(7);
  const keyHash = createHash("sha256").update(raw).digest("hex");
  if (auth.walletRequired) {
    const fundingInvoice = await createFundingInvoice(origin, keyHash);

    return NextResponse.json(
      {
        error: {
          message: auth.error ?? "Free tier exhausted. Fund your account to continue.",
          type: "payment_required",
          code: "free_tier_exceeded",
          funding: fundingInvoice,
          fundUrl: `${origin}/api/wallet/fund`,
          docs: "https://pura.xyz/docs/getting-started-gateway",
        },
      },
      { status: 402, headers: CORS_HEADERS },
    );
  }

  // --- Rate limit ---
  const rl = await checkRateLimitAsync(keyHash);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { message: "Rate limit exceeded. Try again shortly." } },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          "Retry-After": String(Math.ceil(rl.resetMs / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  // --- Parse body ---
  let body: {
    messages?: ChatMessage[];
    model?: string;
    stream?: boolean;
    routing?: RoutingHints;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: { message: "messages array is required" } },
      { status: 400 },
    );
  }

  // Validate message shape
  for (const msg of messages) {
    if (!msg.role || !msg.content || typeof msg.content !== "string") {
      return NextResponse.json(
        { error: { message: "Each message must have role and content" } },
        { status: 400 },
      );
    }
    if (!["system", "user", "assistant"].includes(msg.role)) {
      return NextResponse.json(
        { error: { message: `Invalid role: ${msg.role}` } },
        { status: 400 },
      );
    }
  }

  // --- Route ---
  let provider: Provider;
  let tier;
  let explored = false;
  let experimentalFields: string[] = [];
  try {
    const result = await selectProvider(body.model, messages, body.routing);
    provider = result.provider;
    tier = result.tier;
    explored = result.explored;
    experimentalFields = result.experimentalFields;
  } catch (e) {
    return NextResponse.json(
      { error: { message: (e as Error).message } },
      { status: 503 },
    );
  }

  const promptText = messages.map((m) => m.content).join(" ");
  const requestHash = sha256Hex(JSON.stringify(messages));
  const promptTokens = estimateTokens(promptText);
  const estimatedTotalTokens = promptTokens * 2;
  const estCost = estimateCostUsd(provider, estimatedTotalTokens);
  const estimatedCostSats = estimateCostSats(provider, estimatedTotalTokens);

  const paidTier = auth.billingTier === "paid";
  const settlement = paidTier ? await getOrInitSettlement() : null;
  if (paidTier) {
    if (!settlement) {
      return NextResponse.json(
        { error: { message: "Settlement provider unavailable" } },
        { status: 503, headers: CORS_HEADERS },
      );
    }

    const balance = await settlement.checkBalance(keyHash);
    if (balance.balance < estimatedCostSats) {
      const fundingInvoice = await createFundingInvoice(
        origin,
        keyHash,
        Math.max(10_000, estimatedCostSats),
      );
      return NextResponse.json(
        {
          error: {
            message: `Insufficient balance (${balance.balance} sats). Fund your account to continue.`,
            type: "payment_required",
            code: "insufficient_balance",
            funding: fundingInvoice,
            fundUrl: `${origin}/api/wallet/fund`,
            docs: "https://pura.xyz/docs/getting-started-gateway",
          },
        },
        { status: 402, headers: CORS_HEADERS },
      );
    }
  }

  // --- Budget check (optimistic reserve to prevent concurrent bypass) ---
  const budgetCheck = await checkBudget(keyHash, estCost);
  if (!budgetCheck.allowed) {
    return NextResponse.json(
      {
        error: {
          message: `Daily budget exhausted ($${budgetCheck.capUsd}). Resets at midnight UTC.`,
          type: "budget_exceeded",
          code: "budget_exhausted",
        },
      },
      {
        status: 402,
        headers: {
          ...CORS_HEADERS,
          "X-Pura-Budget-Remaining": "0",
        },
      },
    );
  }

  // --- BYOK: optional provider key pass-through ---
  const providerKey = request.headers.get("x-provider-key") ?? undefined;

  // --- Cascade mode ---
  if (body.routing?.cascade) {
    const cascadeStart = Date.now();
    const threshold = body.routing.cascade_threshold ?? DEFAULT_CASCADE_THRESHOLD;
    const maxDepth = Math.min(body.routing.cascade_max_depth ?? DEFAULT_CASCADE_MAX_DEPTH, 3);
    const cascadeProviders = selectCascadeProviders();

    if (cascadeProviders.length === 0) {
      return NextResponse.json(
        { error: { message: "No providers configured for cascade" } },
        { status: 503, headers: CORS_HEADERS },
      );
    }

    let currentMessages = messages;
    let finalContent = "";
    let finalProvider: Provider = cascadeProviders[0];
    let cascadeDepth = 0;
    let totalCascadeCostUsd = 0;
    const providersUsed: Provider[] = [];
    const confidenceScores: number[] = [];
    let humanTaskId: string | null = null;
    let humanReviewed = false;
    let reviewerProofClass: "unique_human" | undefined;

    // Cost cap: cascade should never exceed what direct-to-premium would cost
    const premiumProvider = cascadeProviders[cascadeProviders.length - 1];
    const baseTokens = estimateTokens(messages.map((m) => m.content).join(" ")) * 2;
    const cascadeCostCap = estimateCostUsd(premiumProvider, baseTokens);

    for (let i = 0; i < Math.min(maxDepth, cascadeProviders.length); i++) {
      // Abort if accumulated cost already exceeds direct-premium cost
      if (i > 0 && totalCascadeCostUsd >= cascadeCostCap) {
        log.info("cascade.cost_cap_hit", { requestId, totalCascadeCostUsd, cascadeCostCap });
        break;
      }
      const tierProvider = cascadeProviders[i];
      cascadeDepth = i + 1;
      providersUsed.push(tierProvider);

      try {
        let content: string;
        if (tierProvider === "anthropic") {
          try {
            content = await collectAnthropicResponse(currentMessages, body.model, providerKey);
          } catch {
            const s = await streamChat(tierProvider, currentMessages, body.model, providerKey);
            content = await collectStreamContent(s);
          }
        } else {
          const s = await streamChat(tierProvider, currentMessages, body.model, providerKey);
          content = await collectStreamContent(s);
        }

        const tierTokens = estimateTokens(currentMessages.map((m) => m.content).join(" ")) +
          estimateTokens(content);
        totalCascadeCostUsd += estimateCostUsd(tierProvider, tierTokens);

        const { score } = scoreConfidence(messages, content);
        confidenceScores.push(score);

        finalContent = content;
        finalProvider = tierProvider;

        log.info("cascade.tier_result", {
          requestId,
          tier: cascadeDepth,
          provider: tierProvider,
          confidence: score.toFixed(3),
          threshold,
          contentLength: content.length,
        });

        if (score >= threshold || i === Math.min(maxDepth, cascadeProviders.length) - 1) {
          break;
        }

        // Build escalation prompt for next tier
        currentMessages = buildEscalationPrompt(messages, content);
      } catch (e) {
        log.warn("cascade.tier_failed", {
          requestId,
          tier: cascadeDepth,
          provider: tierProvider,
          error: (e as Error).message,
        });
        // Continue to next tier on failure
        continue;
      }
    }

    const lastConfidence = confidenceScores[confidenceScores.length - 1] ?? 0;
    const humanThreshold = body.routing?.human_threshold ?? 0.5;
    if (body.routing?.human_fallback && lastConfidence < humanThreshold) {
      const reviewTask = await createReviewTask({
        prompt: promptText,
        candidateResponse: finalContent,
        confidenceSignals: confidenceScores,
        maxWaitMs: Math.min(body.routing.human_max_wait_ms ?? 60_000, 120_000),
        rewardSats: Number(process.env.PURA_HUMAN_REVIEW_REWARD_SATS ?? 250),
        requesterId: keyHash.slice(0, 16),
      });
      humanTaskId = reviewTask.taskId;

      const review = await waitForReview(reviewTask.taskId, body.routing.human_max_wait_ms ?? 60_000);
      if (review) {
        humanReviewed = true;
        reviewerProofClass = "unique_human";
        finalContent = review.finalResponse;
      }
    }

    // Cost if sent directly to premium (already computed above as cascadeCostCap)
    const costIfDirectUsd = cascadeCostCap;
    const savingsUsd = Math.max(0, costIfDirectUsd - totalCascadeCostUsd);
    const savingsPct = costIfDirectUsd > 0 ? (savingsUsd / costIfDirectUsd) * 100 : 0;

    // Record cascade metrics
    recordCascade({
      timestamp: Date.now(),
      requestId,
      cascadeDepth,
      providersUsed,
      finalProvider,
      costUsd: totalCascadeCostUsd,
      costIfDirectUsd,
      confidenceScores,
      latencyMs: Date.now() - cascadeStart,
    });

    // Finalize usage
    const cascadeTotalTokens = Math.ceil(totalCascadeCostUsd / (estimateCostUsd(finalProvider, 1000) / 1000));
    await recordSpend(keyHash, finalProvider, cascadeTotalTokens);
    if (paidTier && settlement) {
      const debitSats = Math.max(1, Math.ceil(totalCascadeCostUsd * 2500));
      await settlement.deductBalance(keyHash, debitSats);
    }

    incrementRequests(raw);
    if (auth.billingTier === "free" && auth.record) {
      await incrementFreeQuotaUsage(keyHash, quotaTier(auth.record));
    }
    recordCompletionEpoch(finalProvider).catch(() => {});
    maybeRebalance().catch(() => {});

    const cascadeLatencyMs = Date.now() - startMs;
    recordRequest(finalProvider, cascadeLatencyMs, true);

    const cascadeHeaders: Record<string, string> = {
      ...CORS_HEADERS,
      "X-Pura-Provider": finalProvider,
      "X-Pura-Model": body.model ?? finalProvider,
      "X-Pura-Cost": totalCascadeCostUsd.toFixed(6),
      "X-Pura-Budget-Remaining": budgetCheck.remainingUsd.toFixed(4),
      "X-Pura-Routed": tier,
      "X-Pura-Tier": tier,
      "X-Pura-Request-Id": requestId,
      "X-Pura-Cascade-Depth": String(cascadeDepth),
      "X-Pura-Cascade-Savings": `${savingsPct.toFixed(1)}%`,
      "X-Pura-Confidence": confidenceScores[confidenceScores.length - 1]?.toFixed(3) ?? "0",
      "X-Pura-Proof-Class": auth.record?.proofClass?.kind ?? "unknown",
      "X-Pura-Proof-Issuer": auth.record?.proofClass?.kind === "unique_human"
        ? auth.record.proofClass.issuer
        : "none",
      "X-Pura-Quota-Period": auth.quotaPeriod,
      "X-Pura-Quota-Remaining": String(Math.max(0, auth.quotaRemaining - (auth.billingTier === "free" ? 1 : 0))),
      "X-RateLimit-Remaining": String(rl.remaining),
    };

    const cascadeReceipt = createReceiptToken({
      receipt_type: "pura.chat_completion",
      proof_class: auth.record?.proofClass?.kind === "unique_human" ? "unique_human" : "unknown",
      cascade_depth: cascadeDepth,
      final_provider: finalProvider,
      human_reviewed: humanReviewed,
      reviewer_proof_class: reviewerProofClass,
      cost_sats: Math.max(1, Math.ceil(totalCascadeCostUsd * 2500)),
      timestamp: new Date().toISOString(),
      request_hash: requestHash,
      response_hash: sha256Hex(finalContent),
    });
    cascadeHeaders["X-Pura-Receipt"] = cascadeReceipt;

    log.info("cascade.complete", {
      requestId,
      depth: cascadeDepth,
      finalProvider,
      totalCostUsd: totalCascadeCostUsd.toFixed(6),
      savingsPct: savingsPct.toFixed(1),
      latencyMs: cascadeLatencyMs,
    });

    return NextResponse.json(
      {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: body.model ?? finalProvider,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: finalContent },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: estimateTokens(messages.map((m) => m.content).join(" ")),
          completion_tokens: estimateTokens(finalContent),
          total_tokens: estimateTokens(messages.map((m) => m.content).join(" ")) + estimateTokens(finalContent),
        },
        cascade: {
          depth: cascadeDepth,
          providers_used: providersUsed,
          confidence_scores: confidenceScores.map((s) => Number(s.toFixed(3))),
          savings_pct: Number(savingsPct.toFixed(1)),
          cost_usd: Number(totalCascadeCostUsd.toFixed(6)),
          human_reviewed: humanReviewed,
          human_task_id: humanTaskId,
        },
      },
      { headers: cascadeHeaders },
    );
  }

  // --- Stream (non-cascade) ---
  const wantStream = body.stream !== false; // default true
  let stream: ReadableStream<Uint8Array>;

  try {
    stream = await streamChat(provider, messages, body.model, providerKey);
  } catch (e) {
    // When using a BYOK key, don't fall back — the key is provider-specific
    if (providerKey) {
      return NextResponse.json(
        { error: { message: (e as Error).message } },
        { status: 502 },
      );
    }
    // Try fallback provider
    const fallback = getFallbackProvider(provider);
    try {
      stream = await streamChat(fallback, messages, undefined);
      provider = fallback;
    } catch {
      return NextResponse.json(
        { error: { message: (e as Error).message } },
        { status: 502 },
      );
    }
  }

  async function finalizeUsage(totalTokens: number) {
    await recordSpend(keyHash, provider, totalTokens);
    if (!paidTier || !settlement) return;

    const debitSats = estimateCostSats(provider, totalTokens);
    const debited = await settlement.deductBalance(keyHash, debitSats);
    if (debited) {
      log.info("wallet.debited", {
        requestId,
        keyHash: keyHash.slice(0, 8),
        debitSats,
        provider,
      });
      return;
    }

    log.warn("wallet.debit_failed", {
      requestId,
      keyHash: keyHash.slice(0, 8),
      debitSats,
      provider,
    });
  }

  // Increment usage
  incrementRequests(raw);
  if (auth.billingTier === "free" && auth.record) {
    await incrementFreeQuotaUsage(keyHash, quotaTier(auth.record));
  }

  // Fire-and-forget: advance completion epoch + maybe rebalance
  recordCompletionEpoch(provider).catch(() => {});
  maybeRebalance().catch(() => {});

  const puraHeaders: Record<string, string> = {
    ...CORS_HEADERS,
    "X-Pura-Provider": provider,
    "X-Pura-Model": body.model ?? provider,
    "X-Pura-Cost": estCost.toFixed(6),
    "X-Pura-Budget-Remaining": budgetCheck.remainingUsd.toFixed(4),
    "X-Pura-Routed": tier,
    "X-Pura-Tier": tier,
    "X-Pura-Request-Id": requestId,
    "X-Pura-Proof-Class": auth.record?.proofClass?.kind ?? "unknown",
    "X-Pura-Proof-Issuer": auth.record?.proofClass?.kind === "unique_human"
      ? auth.record.proofClass.issuer
      : "none",
    "X-Pura-Quota-Period": auth.quotaPeriod,
    "X-Pura-Quota-Remaining": String(Math.max(0, auth.quotaRemaining - (auth.billingTier === "free" ? 1 : 0))),
    "X-RateLimit-Remaining": String(rl.remaining),
  };

  const streamingReceipt = createReceiptToken({
    receipt_type: "pura.chat_completion",
    proof_class: auth.record?.proofClass?.kind === "unique_human" ? "unique_human" : "unknown",
    cascade_depth: 1,
    final_provider: provider,
    human_reviewed: false,
    cost_sats: Math.max(1, estimatedCostSats),
    timestamp: new Date().toISOString(),
    request_hash: requestHash,
    response_hash: "streaming",
  });
  puraHeaders["X-Pura-Receipt"] = streamingReceipt;

  if (body.routing?.quality) {
    puraHeaders["X-Pura-Quality"] = body.routing.quality;
  }
  if (explored) {
    puraHeaders["X-Pura-Explored"] = "true";
  }
  if (experimentalFields.length > 0) {
    puraHeaders["X-Pura-Experimental"] = experimentalFields.join(", ");
  }

  const latencyMs = Date.now() - startMs;
  recordRequest(provider, latencyMs, true);

  log.info("chat.request", {
    requestId,
    provider,
    model: body.model ?? "default",
    messageCount: messages.length,
    promptTokens,
    stream: wantStream,
    latencyMs: Date.now() - startMs,
  });

  if (wantStream) {
    return new Response(withUsageFinalizer(stream, () => finalizeUsage(estimatedTotalTokens)), {
      headers: {
        ...puraHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Non-streaming: collect full response
  // For Anthropic, use direct API call to avoid ReadableStream close issues
  if (!wantStream && (provider === "anthropic")) {
    try {
      const content = await collectAnthropicResponse(messages, body.model, providerKey);
      await finalizeUsage(promptTokens + estimateTokens(content));
      const receipt = createReceiptToken({
        receipt_type: "pura.chat_completion",
        proof_class: auth.record?.proofClass?.kind === "unique_human" ? "unique_human" : "unknown",
        cascade_depth: 1,
        final_provider: provider,
        human_reviewed: false,
        cost_sats: estimateCostSats(provider, promptTokens + estimateTokens(content)),
        timestamp: new Date().toISOString(),
        request_hash: requestHash,
        response_hash: sha256Hex(content),
      });
      return NextResponse.json(
        {
          id: `chatcmpl-${Date.now()}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: body.model ?? provider,
          choices: [
            {
              index: 0,
              message: { role: "assistant", content },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: promptTokens,
            completion_tokens: estimateTokens(content),
            total_tokens: promptTokens + estimateTokens(content),
          },
        },
        { headers: { ...puraHeaders, "X-Pura-Receipt": receipt } },
      );
    } catch (e) {
      // Fall through to stream-based collection
      log.info("anthropic.collect_fallback", { error: (e as Error).message });
    }
  }

  // Non-streaming: collect from stream
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n");
    let streamDone = false;
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") { streamDone = true; break; }
      try {
        const chunk = JSON.parse(payload);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) fullContent += delta;
      } catch {
        // skip
      }
    }
    if (streamDone) break;
  }

  await finalizeUsage(promptTokens + estimateTokens(fullContent));
  const finalReceipt = createReceiptToken({
    receipt_type: "pura.chat_completion",
    proof_class: auth.record?.proofClass?.kind === "unique_human" ? "unique_human" : "unknown",
    cascade_depth: 1,
    final_provider: provider,
    human_reviewed: false,
    cost_sats: estimateCostSats(provider, promptTokens + estimateTokens(fullContent)),
    timestamp: new Date().toISOString(),
    request_hash: requestHash,
    response_hash: sha256Hex(fullContent),
  });
  return NextResponse.json(
    {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model ?? provider,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: fullContent },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: estimateTokens(fullContent),
        total_tokens: promptTokens + estimateTokens(fullContent),
      },
    },
    { headers: { ...puraHeaders, "X-Pura-Receipt": finalReceipt } },
  );
}
