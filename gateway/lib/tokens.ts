/**
 * Lightweight token estimation.
 *
 * English prose averages ~4 chars/token, but code and structured text
 * run closer to 3.3 chars/token due to keywords, punctuation, and
 * whitespace. We split on whitespace and punctuation boundaries for a
 * slightly better approximation than a flat divisor.
 */

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Count whitespace-separated words + punctuation-split fragments
  const words = text.split(/\s+/).filter(Boolean).length;
  // Rough correction: average English word is ~1.3 tokens (subword splits)
  // For code-heavy text, punctuation inflates this to ~1.5 tokens per word
  const hasCode = /[{}();\[\]=>]/.test(text);
  const factor = hasCode ? 1.5 : 1.3;
  return Math.max(1, Math.ceil(words * factor));
}
