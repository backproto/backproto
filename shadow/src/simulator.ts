import type { ShadowMetrics, SinkMetrics } from "./collector.js";

/** Configuration for the BPE shadow simulator. */
export interface SimulatorConfig {
  /** Base fee per completion in msat. Default: 1000 */
  baseFee?: number;
  /** Congestion multiplier γ. Default: 0.5 */
  gamma?: number;
  /** Boltzmann temperature τ. Default: 1.0 */
  temperature?: number;
  /** EWMA smoothing factor α. Default: 0.3 */
  alpha?: number;
}

/** Result of a shadow simulation comparison. */
export interface SimulationResult {
  /** How many requests BPE would have rerouted away from overloaded sinks. */
  shadowReroutedCount: number;
  /** Revenue delta if BPE pricing were active (msat). */
  shadowRevenueDeltaMsat: number;
  /** Number of congestion price signals that would have fired. */
  shadowPriceSignalCount: number;
  /** Per-sink allocation under BPE vs actual. */
  sinkComparison: Record<string, SinkComparison>;
  /** What BPE would have charged per completion (msat). */
  bpePricePerSink: Record<string, number>;
}

export interface SinkComparison {
  actualShare: number;
  bpeShare: number;
  delta: number;
}

/**
 * Port of the BPE simulation logic from bpe_sim.py.
 * Computes what BPE routing/pricing would have done given real metrics.
 */
export class Simulator {
  private readonly baseFee: number;
  private readonly gamma: number;
  private readonly temperature: number;
  private readonly alpha: number;
  private smoothedCapacity: Record<string, number> = {};

  constructor(config?: SimulatorConfig) {
    this.baseFee = config?.baseFee ?? 1000;
    this.gamma = config?.gamma ?? 0.5;
    this.temperature = config?.temperature ?? 1.0;
    this.alpha = config?.alpha ?? 0.3;
  }

  /** Run a shadow comparison against real metrics. */
  simulate(metrics: ShadowMetrics): SimulationResult {
    const sinkIds = Object.keys(metrics.sinks);
    if (sinkIds.length === 0) {
      return {
        shadowReroutedCount: 0,
        shadowRevenueDeltaMsat: 0,
        shadowPriceSignalCount: 0,
        sinkComparison: {},
        bpePricePerSink: {},
      };
    }

    // Update EWMA smoothed capacity per sink
    for (const id of sinkIds) {
      const sink = metrics.sinks[id];
      const raw = sink.throughput;
      const prev = this.smoothedCapacity[id] ?? raw;
      this.smoothedCapacity[id] = this.alpha * raw + (1 - this.alpha) * prev;
    }

    // Compute BPE allocation (Boltzmann soft-max over smoothed capacity)
    const bpeShares = this.boltzmannAllocate(sinkIds);
    const totalRequests = metrics.totalRequests || 1;

    // Compute actual shares
    const actualShares: Record<string, number> = {};
    for (const id of sinkIds) {
      actualShares[id] = metrics.sinks[id].requests / totalRequests;
    }

    // Compute per-sink comparison and counts
    let rerouteCount = 0;
    let priceSignalCount = 0;
    const sinkComparison: Record<string, SinkComparison> = {};
    const bpePricePerSink: Record<string, number> = {};

    for (const id of sinkIds) {
      const actual = actualShares[id] ?? 0;
      const bpe = bpeShares[id] ?? 0;
      const delta = bpe - actual;
      sinkComparison[id] = { actualShare: actual, bpeShare: bpe, delta };

      // If BPE would allocate less, those requests would be rerouted
      if (delta < -0.01) {
        rerouteCount += Math.round(Math.abs(delta) * totalRequests);
      }

      // Compute BPE price for this sink
      const price = this.computePrice(id, metrics.sinks[id]);
      bpePricePerSink[id] = price;

      // Price signal fires when utilization drives price above 1.5x base
      if (price > this.baseFee * 1.5) {
        priceSignalCount++;
      }
    }

    // Revenue delta: sum(bpe_price × bpe_completions) - sum(baseFee × actual_completions)
    let bpeRevenue = 0;
    let actualRevenue = 0;
    for (const id of sinkIds) {
      const sink = metrics.sinks[id];
      const bpeCompletions = Math.round((bpeShares[id] ?? 0) * metrics.totalCompletions);
      bpeRevenue += bpePricePerSink[id] * bpeCompletions;
      actualRevenue += this.baseFee * sink.completions;
    }

    return {
      shadowReroutedCount: rerouteCount,
      shadowRevenueDeltaMsat: Math.round(bpeRevenue - actualRevenue),
      shadowPriceSignalCount: priceSignalCount,
      sinkComparison,
      bpePricePerSink,
    };
  }

  /**
   * Boltzmann (soft-max) allocation over smoothed capacities.
   * share_i = exp(cap_i / τ) / Σ exp(cap_j / τ)
   */
  private boltzmannAllocate(sinkIds: string[]): Record<string, number> {
    const shares: Record<string, number> = {};
    const caps = sinkIds.map((id) => this.smoothedCapacity[id] ?? 0);

    // Numerical stability: subtract max before exp
    const maxCap = Math.max(...caps, 1e-9);
    const exps = caps.map((c) => Math.exp(c / (this.temperature * maxCap || 1)));
    const sumExp = exps.reduce((a, b) => a + b, 0) || 1;

    for (let i = 0; i < sinkIds.length; i++) {
      shares[sinkIds[i]] = exps[i] / sumExp;
    }
    return shares;
  }

  /**
   * BPE congestion price: baseFee × (1 + γ × queueLoad / capacity)
   * queueLoad approximated from request rate - completion rate.
   */
  private computePrice(sinkId: string, sink: SinkMetrics): number {
    const capacity = this.smoothedCapacity[sinkId] || 1;
    const queueLoad = Math.max(0, sink.requests - sink.completions);
    return Math.round(this.baseFee * (1 + this.gamma * (queueLoad / capacity)));
  }

  /** Reset EWMA state. */
  reset(): void {
    this.smoothedCapacity = {};
  }
}
