/**
 * Income statement generator.
 * Pulls from budget + quality data and formats into a structured report.
 */

import { getDailyReport } from "./budget";
import { getQualityScore } from "./quality";
import { getProviderStatuses } from "./metrics";
import { getCascadeStats } from "./cascade-metrics";

const SATS_PER_USD = 2500;

export interface IncomeStatement {
  period: string;
  generatedAt: string;
  revenue: {
    marketplaceSats: number;
    totalSats: number;
  };
  costs: {
    perProvider: Record<string, { usd: number; sats: number; requests: number }>;
    totalUsd: number;
    totalSats: number;
  };
  netIncomeSats: number;
  quality: {
    perProvider: Record<string, number>;
    aggregate: number;
  };
  health: {
    providersUp: number;
    providersTotal: number;
    avgSuccessRate: number;
  };
  cascade: {
    totalRequests: number;
    resolvedTier1: number;
    resolvedTier2: number;
    resolvedTier3: number;
    avgSavingsPct: number;
  };
  networkRank: number | null;
}

export async function generateIncomeStatement(keyHash: string): Promise<IncomeStatement> {
  const report = await getDailyReport(keyHash);
  const statuses = getProviderStatuses();
  const now = new Date().toISOString();

  // Build per-provider cost breakdown
  const perProvider: Record<string, { usd: number; sats: number; requests: number }> = {};
  for (const [provider, usd] of Object.entries(report.perModel)) {
    perProvider[provider] = {
      usd: Number(usd.toFixed(6)),
      sats: Math.ceil(usd * SATS_PER_USD),
      requests: 0, // per-provider request counts not tracked separately in budget yet
    };
  }

  const totalCostUsd = report.spentUsd;
  const totalCostSats = Math.ceil(totalCostUsd * SATS_PER_USD);

  // Marketplace earnings (zero until marketplace goes live)
  const marketplaceSats = 0;
  const totalRevenueSats = marketplaceSats;

  // Quality scores
  const providers = ["openai", "anthropic", "groq", "gemini"];
  const qualityPerProvider: Record<string, number> = {};
  let qualitySum = 0;
  let qualityCount = 0;
  for (const p of providers) {
    const score = getQualityScore(p);
    qualityPerProvider[p] = Number(score.toFixed(3));
    qualitySum += score;
    qualityCount++;
  }

  // Health
  const up = statuses.filter((s) => s.available).length;
  const successRates = statuses.map((s) => {
    const h = s.buckets.find((b) => b.window === "1h");
    return h && h.requests > 0 ? h.successRate : 1;
  });
  const avgSuccessRate = successRates.reduce((a, b) => a + b, 0) / successRates.length;

  const cascadeStats = getCascadeStats();

  return {
    period: "24h",
    generatedAt: now,
    revenue: {
      marketplaceSats,
      totalSats: totalRevenueSats,
    },
    costs: {
      perProvider,
      totalUsd: Number(totalCostUsd.toFixed(6)),
      totalSats: totalCostSats,
    },
    netIncomeSats: totalRevenueSats - totalCostSats,
    quality: {
      perProvider: qualityPerProvider,
      aggregate: qualityCount > 0 ? Number((qualitySum / qualityCount).toFixed(3)) : 1,
    },
    health: {
      providersUp: up,
      providersTotal: statuses.length,
      avgSuccessRate: Number(avgSuccessRate.toFixed(3)),
    },
    cascade: {
      totalRequests: cascadeStats.totalRequests,
      resolvedTier1: cascadeStats.resolvedTier1,
      resolvedTier2: cascadeStats.resolvedTier2,
      resolvedTier3: cascadeStats.resolvedTier3,
      avgSavingsPct: cascadeStats.avgSavingsPct,
    },
    networkRank: null,
  };
}

export function formatIncomeText(stmt: IncomeStatement): string {
  const lines: string[] = [];
  lines.push("=== PURA INCOME STATEMENT ===");
  lines.push(`Period: ${stmt.period} | Generated: ${stmt.generatedAt}`);
  lines.push("");
  lines.push("REVENUE");
  lines.push(`  Marketplace:  ${stmt.revenue.marketplaceSats.toLocaleString()} sats`);
  lines.push(`  Total:        ${stmt.revenue.totalSats.toLocaleString()} sats`);
  lines.push("");
  lines.push("COSTS");
  for (const [provider, data] of Object.entries(stmt.costs.perProvider)) {
    lines.push(`  ${provider.padEnd(12)} $${data.usd.toFixed(4)}  (${data.sats.toLocaleString()} sats)`);
  }
  lines.push(`  Total:        $${stmt.costs.totalUsd.toFixed(4)}  (${stmt.costs.totalSats.toLocaleString()} sats)`);
  lines.push("");
  lines.push("NET INCOME");
  const sign = stmt.netIncomeSats >= 0 ? "+" : "";
  lines.push(`  ${sign}${stmt.netIncomeSats.toLocaleString()} sats`);
  lines.push("");
  lines.push("QUALITY");
  for (const [provider, score] of Object.entries(stmt.quality.perProvider)) {
    const bar = "█".repeat(Math.round(score * 10)) + "░".repeat(10 - Math.round(score * 10));
    lines.push(`  ${provider.padEnd(12)} ${bar} ${score}`);
  }
  lines.push(`  Aggregate:    ${stmt.quality.aggregate}`);
  lines.push("");
  lines.push("HEALTH");
  lines.push(`  Providers:    ${stmt.health.providersUp}/${stmt.health.providersTotal} up`);
  lines.push(`  Success rate: ${(stmt.health.avgSuccessRate * 100).toFixed(1)}%`);
  if (stmt.networkRank !== null) {
    lines.push(`  Network rank: #${stmt.networkRank}`);
  }
  if (stmt.cascade.totalRequests > 0) {
    lines.push("");
    lines.push("CASCADE ROUTING");
    lines.push(`  Total:        ${stmt.cascade.totalRequests} requests`);
    lines.push(`  Tier 1:       ${stmt.cascade.resolvedTier1} (${stmt.cascade.totalRequests > 0 ? ((stmt.cascade.resolvedTier1 / stmt.cascade.totalRequests) * 100).toFixed(0) : 0}%)`);
    lines.push(`  Tier 2:       ${stmt.cascade.resolvedTier2}`);
    lines.push(`  Tier 3:       ${stmt.cascade.resolvedTier3}`);
    lines.push(`  Avg savings:  ${stmt.cascade.avgSavingsPct.toFixed(1)}%`);
  }
  lines.push("==============================");
  return lines.join("\n");
}
