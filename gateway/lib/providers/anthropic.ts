import type { ChatMessage, ProviderConfig } from "../providers";

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
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text}`);
  }

  // Transform Anthropic SSE stream to OpenAI-compatible SSE
  const reader = res.body!.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === "[DONE]") continue;

        try {
          const event = JSON.parse(payload);

          if (event.type === "content_block_delta" && event.delta?.text) {
            // Convert to OpenAI chunk format
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
            // Close the stream after message_stop — Anthropic may send
            // additional events (message_delta with usage) but the completion
            // is done. Without this, the non-streaming collector hangs.
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            reader.cancel();
            return;
          }
        } catch {
          // Skip malformed lines
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
// deploy 1774473663
