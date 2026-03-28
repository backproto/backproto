/**
 * In-memory rolling 24h window for cascade routing metrics.
 * No database dependency — just a capped array with timestamp filtering.
 */

import type { Provider } from "./providers";

export interface CascadeRecord {
  timestamp: number;
  requestId: string;
  cascadeDepth: number;
  providersUsed: Provider[];
  finalProvider: Provider;
  costUsd: number;
  /** What it would have cost routed directly to the final provider */
  costIfDirectUsd: number;
  confidenceScores: number[];
  latencyMs: number;
}

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RECORDS = 100_000;

const records: CascadeRecord[] = [];
let writeIdx = 0;
let full = false;

function activeRecords(): CascadeRecord[] {
  const cutoff = Date.now() - WINDOW_MS;
  const all = full ? records : records.slice(0, writeIdx);
  return all.filter((r) => r.timestamp >= cutoff);
}

export function recordCascade(record: CascadeRecord): void {
  if (records.length < MAX_RECORDS) {
    records.push(record);
    writeIdx = records.length;
  } else {
    records[writeIdx % MAX_RECORDS] = record;
    writeIdx++;
    full = true;
  }
}

export interface CascadeStats {
  totalRequests: number;
  resolvedTier1: number;
  resolvedTier2: number;
  resolvedTier3: number;
  avgSavingsPct: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  totalSavedUsd: number;
}

export function getCascadeStats(): CascadeStats {
  const active = activeRecords();

  if (active.length === 0) {
    return {
      totalRequests: 0,
      resolvedTier1: 0,
      resolvedTier2: 0,
      resolvedTier3: 0,
      avgSavingsPct: 0,
      avgLatencyMs: 0,
      totalCostUsd: 0,
      totalSavedUsd: 0,
    };
  }

  let tier1 = 0;
  let tier2 = 0;
  let tier3 = 0;
  let totalSavings = 0;
  let totalLatency = 0;
  let totalCost = 0;
  let totalSaved = 0;

for (const r of active) {
    if (r.cascadeDepth === 1) tier1++;
    else if (r.cascadeDepth === 2) tier2++;
    else tier3++;

    const saved = r.costIfDirectUsd - r.costUsd;
    const savingsPct = r.costIfDirectUsd > 0 ? (saved / r.costIfDirectUsd) * 100 : 0;
    totalSavings += savingsPct;
    totalLatency += r.latencyMs;
    totalCost += r.costUsd;
    totalSaved += Math.max(0, saved);
  }

  return {
    totalRequests: active.length,
    resolvedTier1: tier1,
    resolvedTier2: tier2,
    resolvedTier3: tier3,
    avgSavingsPct: Number((totalSavings / active.length).toFixed(1)),
    avgLatencyMs: Math.round(totalLatency / active.length),
    totalCostUsd: Number(totalCost.toFixed(6)),
    totalSavedUsd: Number(totalSaved.toFixed(6)),
  };
}

export interface SavingsRecord {
  requestId: string;
  cascadeDepth: number;
  providerUsed: Provider;
  costUsd: number;
  costIfOpenai: number;
  costIfAnthropic: number;
  savingsVsDefaultPct: number;
}

/** Cost per 1K tokens by provider — mirrors budget.ts */
const COST_PER_1K: Record<string, number> = {
  openai: 0.005,
  anthropic: 0.003,
  groq: 0.0003,
  gemini: 0.0005,
};

export function getSavingsBreakdown(): {
  requests: SavingsRecord[];
  summary: { totalCostUsd: number; totalIfAllOpenai: number; totalSavingsPct: number };
} {
  const active = activeRecords();

  const savingsRecords: SavingsRecord[] = active.map((r) => {
    // Estimate what it would cost on openai/anthropic using the same token volume
    // Approximate tokens from cost: cost = (tokens / 1000) * rate
    const providerRate = COST_PER_1K[r.finalProvider] ?? COST_PER_1K.openai;
    const approxTokens = providerRate > 0 ? (r.costUsd / providerRate) * 1000 : 0;

    const costIfOpenai = (approxTokens / 1000) * COST_PER_1K.openai;
    const costIfAnthropic = (approxTokens / 1000) * COST_PER_1K.anthropic;
    const defaultCost = costIfOpenai; // Compare against openai as default
    const savings = defaultCost > 0 ? ((defaultCost - r.costUsd) / defaultCost) * 100 : 0;

    return {
      requestId: r.requestId,
      cascadeDepth: r.cascadeDepth,
      providerUsed: r.finalProvider,
      costUsd: Number(r.costUsd.toFixed(6)),
      costIfOpenai: Number(costIfOpenai.toFixed(6)),
      costIfAnthropic: Number(costIfAnthropic.toFixed(6)),
      savingsVsDefaultPct: Number(Math.max(0, savings).toFixed(1)),
    };
  });

  const totalCost = savingsRecords.reduce((sum, r) => sum + r.costUsd, 0);
  const totalIfOpenai = savingsRecords.reduce((sum, r) => sum + r.costIfOpenai, 0);
  const totalSavingsPct =
    totalIfOpenai > 0 ? ((totalIfOpenai - totalCost) / totalIfOpenai) * 100 : 0;

  return {
    requests: savingsRecords.slice(-100), // Last 100 requests
    summary: {
      totalCostUsd: Number(totalCost.toFixed(6)),
      totalIfAllOpenai: Number(totalIfOpenai.toFixed(6)),
      totalSavingsPct: Number(totalSavingsPct.toFixed(1)),
    },
  };
}
