import type { ChatMessage, ProviderConfig } from "../providers";

/**
 * Stream a chat completion from OpenAI.
 * Returns a ReadableStream of SSE chunks in OpenAI format.
 */
export async function streamOpenAI(
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
    throw new Error(`OpenAI returned ${res.status}`);
  }

  return res.body!;
}
