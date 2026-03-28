import type { ChatMessage, ProviderConfig } from "../providers";

/**
 * Direct non-streaming Anthropic call. Bypasses the ReadableStream SSE adapter
 * to avoid stream close propagation issues on serverless runtimes.
 */
export async function collectAnthropicResponse(
  messages: ChatMessage[],
  model?: string,
  providerKey?: string,
): Promise<string> {
  const key = providerKey ?? process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");

  const systemMsg = messages.find((m) => m.role === "system");
  const conversationMsgs = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    model: model ?? "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: conversationMsgs.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };
  if (systemMsg) {
    body.system = systemMsg.content;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    await res.text().catch(() => {});
    throw new Error(`Anthropic returned ${res.status}`);
  }

  const data = (await res.json()) as {
    content: { type: string; text: string }[];
  };

  return data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("");
}

/**
 * Stream a chat completion from Anthropic, converting to OpenAI SSE format.
 * Anthropic uses a different request/response shape, so we adapt on the fly.
 */
export async function streamAnthropic(
  config: ProviderConfig,
  messages: ChatMessage[],
  model?: string,
): Promise<ReadableStream<Uint8Array>> {
  // Separate system message from conversation
  const systemMsg = messages.find((m) => m.role === "system");
  const conversationMsgs = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    model: model ?? config.model,
    max_tokens: 4096,
    stream: true,
    messages: conversationMsgs.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };
  if (systemMsg) {
    body.system = systemMsg.content;
  }

  const res = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    await res.text().catch(() => {});
    throw new Error(`Anthropic returned ${res.status}`);
  }

  // Transform Anthropic SSE stream to OpenAI-compatible SSE
  const reader = res.body!.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  let closed = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (closed) return;

      const { done, value } = await reader.read();
      if (done) {
        if (!closed) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          closed = true;
        }
        return;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines from the buffer
      const parts = buffer.split("\n");
      // Last element may be incomplete — keep it in buffer
      buffer = parts.pop() ?? "";

      for (const line of parts) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === "[DONE]") continue;

        try {
          const event = JSON.parse(payload);

          if (event.type === "content_block_delta" && event.delta?.text) {
            const chunk = {
              id: `chatcmpl-${Date.now()}`,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: model ?? config.model,
              choices: [
                {
                  index: 0,
                  delta: { content: event.delta.text },
                  finish_reason: null,
                },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
            );
          } else if (event.type === "message_stop") {
            const chunk = {
              id: `chatcmpl-${Date.now()}`,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: model ?? config.model,
              choices: [
                { index: 0, delta: {}, finish_reason: "stop" },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            closed = true;
            controller.close();
            reader.cancel().catch(() => {});
            return;
          }
        } catch {
          // Skip malformed lines
        }
      }
    },
    cancel() {
      closed = true;
      reader.cancel().catch(() => {});
    },
  });
}
