import type { ChatMessage, ProviderConfig } from "../providers";

/**
 * Stream a chat completion from Groq.
 * Groq uses an OpenAI-compatible API, so the request/response format is identical.
 */
export async function streamGroq(
  config: ProviderConfig,
  messages: ChatMessage[],
  model?: string,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: model ?? config.model,
      messages,
      stream: true,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    await res.text().catch(() => {});
    throw new Error(`Groq returned ${res.status}`);
  }

  return res.body!;
}
