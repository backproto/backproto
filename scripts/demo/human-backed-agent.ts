#!/usr/bin/env tsx

/*
  Demo flow:
  1) verify proof
  2) attach proof to key
  3) send low-confidence cascade request with human fallback
  4) claim + submit review from reviewer key
  5) inspect receipt
*/

const BASE = process.env.PURA_GATEWAY_URL ?? "http://localhost:3000";
const USER_KEY = process.env.PURA_USER_KEY;
const REVIEWER_KEY = process.env.PURA_REVIEWER_KEY;

if (!USER_KEY || !REVIEWER_KEY) {
  throw new Error("Set PURA_USER_KEY and PURA_REVIEWER_KEY in env before running this demo");
}

async function post(path: string, key: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json, headers: res.headers };
}

async function main() {
  const verify = await post("/v1/proofs/verify", USER_KEY, {
    issuer: "world_id",
    proof: {
      mock_valid: true,
      nullifier_hash: `demo-nullifier-${Date.now()}`,
    },
  });
  if (verify.status !== 200) throw new Error(`verify failed: ${JSON.stringify(verify.json)}`);

  const attach = await post("/api/keys/attach-proof", USER_KEY, {
    proof_id: verify.json.proof_id,
  });
  if (attach.status !== 200) throw new Error(`attach failed: ${JSON.stringify(attach.json)}`);

  const chat = await post("/api/chat", USER_KEY, {
    stream: false,
    messages: [
      {
        role: "user",
        content: "Give me a rigorous, cited proof sketch for why this novel theorem is true with all edge cases.",
      },
    ],
    routing: {
      cascade: true,
      cascade_threshold: 0.95,
      human_fallback: true,
      human_threshold: 0.9,
      human_max_wait_ms: 15000,
    },
  });

  if (chat.status !== 200) {
    throw new Error(`chat failed: ${JSON.stringify(chat.json)}`);
  }

  const fallbackTaskId = chat.json?.cascade?.human_task_id as string | undefined;
  if (!fallbackTaskId) {
    console.log("No human fallback task created; adjust thresholds and try again.");
    return;
  }

  const claim = await post("/api/marketplace/review/claim", REVIEWER_KEY, { taskId: fallbackTaskId });
  if (claim.status !== 200) throw new Error(`claim failed: ${JSON.stringify(claim.json)}`);

  const submit = await post("/api/marketplace/review/submit", REVIEWER_KEY, {
    taskId: fallbackTaskId,
    decision: "edit",
    editedResponse: "Human reviewer edited response: clarify assumptions and include a bounded-risk recommendation.",
    notes: "Low confidence from model-only cascade; human pass applied.",
    qualityRating: 1,
  });
  if (submit.status !== 200) throw new Error(`submit failed: ${JSON.stringify(submit.json)}`);

  const verifyReceiptUrl = new URL(`${BASE}/api/receipts/verify`);
  const receipt = chat.headers.get("x-pura-receipt");
  if (!receipt) {
    console.log("Response did not include X-Pura-Receipt header.");
    return;
  }

  verifyReceiptUrl.searchParams.set("receipt", receipt);
  const receiptRes = await fetch(verifyReceiptUrl.toString());
  const receiptJson = await receiptRes.json();

  console.log(JSON.stringify({
    proof: verify.json,
    attach: attach.json,
    chatCascade: chat.json.cascade,
    receipt: receiptJson,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
