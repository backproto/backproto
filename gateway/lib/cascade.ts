/**
 * Confidence heuristic for cascade routing.
 *
 * Scores a response on four dimensions to decide whether to escalate
 * to a higher-tier provider or accept the current response.
 */

import type { ChatMessage } from "./providers";
import { scoreComplexity } from "./complexity";

const HEDGING_PATTERNS = [
  /\bi'?m not sure\b/i,
  /\bit depends\b/i,
  /\bthis is a complex topic\b/i,
  /\bi cannot\b/i,
  /\bi can't\b/i,
  /\bi don't have enough\b/i,
  /\bgenerally speaking\b/i,
  /\bthere'?s no (?:simple|easy|definitive) answer\b/i,
  /\bit'?s (?:hard|difficult) to say\b/i,
  /\bI would need more (?:context|information)\b/i,
];

const REFUSAL_PATTERNS = [
  /\bi (?:cannot|can't|am unable to|won't) (?:help|assist|provide|generate|create)\b/i,
  /\bas an ai\b/i,
  /\bmy training data\b/i,
  /\bi don't have (?:access|the ability)\b/i,
  /\bviolates? (?:my|our) (?:guidelines|policies|terms)\b/i,
  /\bcontent policy\b/i,
];

/** Default confidence threshold — accept if score >= this value */
export const DEFAULT_CASCADE_THRESHOLD = 0.7;

/** Default maximum escalation depth */
export const DEFAULT_CASCADE_MAX_DEPTH = 3;

export interface ConfidenceResult {
  score: number;
  signals: {
    lengthScore: number;
    hedgingScore: number;
    refusalScore: number;
    completenessScore: number;
  };
}

/**
 * Score confidence in a response. Returns 0–1 where higher = more confident.
 *
 * Four signals:
 * 1. Response length relative to prompt complexity
 * 2. Hedging language detection
 * 3. Refusal / safety-filter patterns
 * 4. Structural completeness (addresses all parts of the prompt)
 */
export function scoreConfidence(
  messages: ChatMessage[],
  response: string,
): ConfidenceResult {
  const promptText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");

  const lengthScore = scoreLengthRatio(promptText, response, messages);
  const hedgingScore = scoreHedging(response);
  const refusalScore = scoreRefusal(response);
  const completenessScore = scoreCompleteness(promptText, response);

  // Weighted average — refusal is weighted heaviest, length lightest
  const score =
    lengthScore * 0.15 +
    hedgingScore * 0.25 +
    refusalScore * 0.30 +
    completenessScore * 0.30;

  return {
    score: Math.max(0, Math.min(1, score)),
    signals: { lengthScore, hedgingScore, refusalScore, completenessScore },
  };
}

/**
 * Length ratio: very short responses to complex prompts signal low confidence.
 * Very short = fewer than 50 chars for a prompt over 200 chars.
 */
function scoreLengthRatio(
  prompt: string,
  response: string,
  messages: ChatMessage[],
): number {
  const tier = scoreComplexity(messages);
  const respLen = response.trim().length;

  // Short responses to simple prompts are fine
  if (tier === "cheap") return respLen > 10 ? 1.0 : 0.5;

  // For mid/premium tasks, expect substantive responses
  const ratio = respLen / Math.max(prompt.length, 1);

  if (tier === "premium") {
    if (respLen < 50) return 0.2;
    if (respLen < 150) return 0.5;
    if (ratio < 0.3) return 0.6;
    return 1.0;
  }

  // mid
  if (respLen < 30) return 0.3;
  if (respLen < 100) return 0.6;
  return 1.0;
}

/** Hedging: count matches against known hedging patterns. */
function scoreHedging(response: string): number {
  let matches = 0;
  for (const pattern of HEDGING_PATTERNS) {
    if (pattern.test(response)) matches++;
  }
  if (matches === 0) return 1.0;
  if (matches === 1) return 0.7;
  if (matches === 2) return 0.4;
  return 0.2;
}

/** Refusal: any refusal pattern tanks confidence. */
function scoreRefusal(response: string): number {
  for (const pattern of REFUSAL_PATTERNS) {
    if (pattern.test(response)) return 0.1;
  }
  return 1.0;
}

/**
 * Completeness: does the response address all parts of the prompt?
 * Counts question marks in the user prompt as a proxy for multi-part questions.
 * Checks that the response has at least as many paragraph breaks or distinct
 * answer segments.
 */
function scoreCompleteness(prompt: string, response: string): number {
  const questions = (prompt.match(/\?/g) || []).length;
  if (questions <= 1) return response.trim().length > 20 ? 1.0 : 0.5;

  // For multi-question prompts, check that response has structure
  const paragraphs = response.split(/\n\s*\n/).filter((p) => p.trim().length > 10);
  const listItems = (response.match(/^[\s]*[-*\d.]+[\s]/gm) || []).length;
  const segments = Math.max(paragraphs.length, listItems);

  const coverage = Math.min(segments / questions, 1.0);
  return coverage < 0.5 ? 0.4 : coverage;
}

/**
 * Build the escalation system message for the next cascade tier.
 */
export function buildEscalationPrompt(
  originalMessages: ChatMessage[],
  previousResponse: string,
): ChatMessage[] {
  return [
    ...originalMessages,
    { role: "assistant" as const, content: previousResponse },
    {
      role: "user" as const,
      content:
        "A faster model produced the response above but confidence was low. Please provide a more thorough, complete answer to the original question.",
    },
  ];
}
