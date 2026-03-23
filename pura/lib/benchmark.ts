/**
 * TypeScript port of simulation/bpe_sim.py — client-side BPE benchmark.
 * 4-strategy comparison: Random, Round-robin, Centralized LB, BPE (Boltzmann).
 */

// ── Seeded PRNG (xoshiro128**) ──

class Rng {
  private s: Uint32Array;

  constructor(seed: number) {
    this.s = new Uint32Array(4);
    this.s[0] = seed >>> 0;
    this.s[1] = (seed * 1812433253 + 1) >>> 0;
    this.s[2] = (this.s[1] * 1812433253 + 1) >>> 0;
    this.s[3] = (this.s[2] * 1812433253 + 1) >>> 0;
  }

  next(): number {
    const s = this.s;
    const result = (((s[1] * 5) << 7) | ((s[1] * 5) >>> 25)) * 9;
    const t = s[1] << 9;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = ((s[3] << 11) | (s[3] >>> 21)) >>> 0;
    return (result >>> 0) / 4294967296;
  }

  uniform(lo: number, hi: number): number {
    return lo + this.next() * (hi - lo);
  }

  normal(mean: number, std: number): number {
    // Box-Muller
    const u1 = this.next() || 1e-10;
    const u2 = this.next();
    return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  dirichlet(n: number): number[] {
    const g: number[] = [];
    let sum = 0;
    for (let i = 0; i < n; i++) {
      // gamma(1,1) ≈ -log(uniform)
      const v = -Math.log(this.next() || 1e-10);
      g.push(v);
      sum += v;
    }
    return g.map((v) => v / sum);
  }
}

// ── Types ──

export interface BenchmarkConfig {
  nSinks: number;
  nSources: number;
  nTaskTypes: number;
  timesteps: number;
  ewmaAlpha: number;
  minStake: number;
  seed: number;
  /** Fraction of sinks killed at killAt timestep (shock test). */
  killFraction: number;
  killAt: number;
  /** Boltzmann temperature. */
  temperature: number;
  /** Demand burst multiplier applied every burstEvery steps for burstDuration steps. */
  burstMultiplier: number;
  burstEvery: number;
  burstDuration: number;
}

export const DEFAULT_CONFIG: BenchmarkConfig = {
  nSinks: 20,
  nSources: 8,
  nTaskTypes: 3,
  timesteps: 500,
  ewmaAlpha: 0.3,
  minStake: 100,
  seed: 42,
  killFraction: 0.2,
  killAt: 250,
  temperature: 1.0,
  burstMultiplier: 3.0,
  burstEvery: 50,
  burstDuration: 10,
};

export type Strategy = "random" | "roundRobin" | "centralizedLB" | "bpe";

export interface TimeSeries {
  efficiency: number[];
  maxBacklog: number[];
  completionRate: number[];
  fairness: number[];
}

export interface BenchmarkResult {
  strategy: Strategy;
  label: string;
  series: TimeSeries;
  avgEfficiency: number;
  avgCompletionRate: number;
  avgFairness: number;
  burstRecoverySteps: number;
}

// ── Sink/Source ──

interface Sink {
  id: number;
  taskType: number;
  trueCapacity: number;
  stake: number;
  smoothedCapacity: number;
  paymentReceived: number;
  queueBacklog: number;
}

interface Source {
  id: number;
  taskType: number;
  flowRate: number;
}

// ── Allocation strategies ──

function relevantSinks(sinks: Sink[], taskType: number): Sink[] {
  return sinks.filter((s) => s.taskType === taskType);
}

function allocateRandom(
  sinks: Sink[],
  totalPayment: number,
  taskType: number,
  rng: Rng,
): void {
  const rel = relevantSinks(sinks, taskType);
  if (rel.length === 0) return;
  const weights = rng.dirichlet(rel.length);
  for (let i = 0; i < rel.length; i++) {
    rel[i].paymentReceived += weights[i] * totalPayment;
  }
}

function allocateRoundRobin(
  sinks: Sink[],
  totalPayment: number,
  taskType: number,
): void {
  const rel = relevantSinks(sinks, taskType);
  if (rel.length === 0) return;
  const share = totalPayment / rel.length;
  for (const s of rel) s.paymentReceived += share;
}

function allocateCentralizedLB(
  sinks: Sink[],
  totalPayment: number,
  taskType: number,
): void {
  const rel = relevantSinks(sinks, taskType);
  if (rel.length === 0) return;
  // "Perfect" centralized: allocate proportional to true capacity (oracle knowledge)
  const caps = rel.map((s) => s.trueCapacity);
  const total = caps.reduce((a, b) => a + b, 0) || 1;
  for (let i = 0; i < rel.length; i++) {
    rel[i].paymentReceived += (caps[i] / total) * totalPayment;
  }
}

function allocateBPE(
  sinks: Sink[],
  totalPayment: number,
  taskType: number,
  temperature: number,
): void {
  const rel = relevantSinks(sinks, taskType);
  if (rel.length === 0) return;
  const caps = rel.map((s) => s.smoothedCapacity);
  const maxCap = Math.max(...caps, 1e-9);
  const tau = Math.max(temperature, 0.01);
  const logits = caps.map((c) => c / tau);
  const maxLogit = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxLogit));
  const sumExp = exps.reduce((a, b) => a + b, 0) || 1;
  for (let i = 0; i < rel.length; i++) {
    rel[i].paymentReceived += (exps[i] / sumExp) * totalPayment;
  }
}

// ── Core simulation ──

function signalCapacity(sink: Sink, alpha: number, rng: Rng): void {
  const noise = rng.normal(0, 0.05 * sink.trueCapacity);
  let raw = Math.max(0, sink.trueCapacity + noise);
  const cap = Math.sqrt(sink.stake);
  raw = Math.min(raw, cap);
  sink.smoothedCapacity = alpha * raw + (1 - alpha) * sink.smoothedCapacity;
}

function jainFairness(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  const sumSq = values.reduce((a, b) => a + b * b, 0);
  const n = values.length;
  if (sumSq === 0) return 1;
  return (sum * sum) / (n * sumSq);
}

function runOneStrategy(
  config: BenchmarkConfig,
  strategy: Strategy,
): TimeSeries {
  const rng = new Rng(config.seed);

  const sinks: Sink[] = [];
  for (let i = 0; i < config.nSinks; i++) {
    sinks.push({
      id: i,
      taskType: i % config.nTaskTypes,
      trueCapacity: rng.uniform(10, 100),
      stake: rng.uniform(config.minStake, config.minStake * 10),
      smoothedCapacity: rng.uniform(10, 100),
      paymentReceived: 0,
      queueBacklog: 0,
    });
  }

  const sources: Source[] = [];
  for (let i = 0; i < config.nSources; i++) {
    sources.push({
      id: i,
      taskType: i % config.nTaskTypes,
      flowRate: rng.uniform(50, 200),
    });
  }

  const series: TimeSeries = {
    efficiency: [],
    maxBacklog: [],
    completionRate: [],
    fairness: [],
  };

  for (let t = 0; t < config.timesteps; t++) {
    // Shock: kill sinks
    if (config.killFraction > 0 && t === config.killAt) {
      const nKill = Math.floor(sinks.length * config.killFraction);
      for (let i = 0; i < nKill; i++) {
        sinks[i].trueCapacity = 0;
        sinks[i].smoothedCapacity = 0;
      }
    }

    // Signal capacity
    for (const s of sinks) signalCapacity(s, config.ewmaAlpha, rng);

    // Reset payments
    for (const s of sinks) s.paymentReceived = 0;

    // Demand burst
    const isBurst =
      config.burstMultiplier > 1 &&
      t % config.burstEvery < config.burstDuration;
    const demandMult = isBurst ? config.burstMultiplier : 1.0;

    // Allocate per task type
    for (let tt = 0; tt < config.nTaskTypes; tt++) {
      const totalPayment =
        sources
          .filter((s) => s.taskType === tt)
          .reduce((acc, s) => acc + s.flowRate, 0) * demandMult;

      switch (strategy) {
        case "random":
          allocateRandom(sinks, totalPayment, tt, rng);
          break;
        case "roundRobin":
          allocateRoundRobin(sinks, totalPayment, tt);
          break;
        case "centralizedLB":
          allocateCentralizedLB(sinks, totalPayment, tt);
          break;
        case "bpe":
          allocateBPE(sinks, totalPayment, tt, config.temperature);
          break;
      }
    }

    // Queue backlog
    for (const s of sinks) {
      const overflow = Math.max(0, s.paymentReceived - s.trueCapacity);
      s.queueBacklog = s.queueBacklog * 0.9 + overflow;
    }

    // Metrics
    let productive = 0;
    let totalPaid = 0;
    let completed = 0;
    let total = 0;
    const utilizations: number[] = [];

    for (const s of sinks) {
      productive += Math.min(s.paymentReceived, s.trueCapacity);
      totalPaid += s.paymentReceived;
      if (s.trueCapacity > 0) {
        completed += Math.min(s.paymentReceived, s.trueCapacity);
        total += s.paymentReceived;
        utilizations.push(
          s.trueCapacity > 0
            ? Math.min(1, s.paymentReceived / s.trueCapacity)
            : 0,
        );
      }
    }

    series.efficiency.push(totalPaid > 0 ? productive / totalPaid : 0);
    series.maxBacklog.push(
      sinks.reduce((max, s) => Math.max(max, s.queueBacklog), 0),
    );
    series.completionRate.push(total > 0 ? completed / total : 0);
    series.fairness.push(jainFairness(utilizations));
  }

  return series;
}

// ── Public API ──

export function runBenchmark(config: BenchmarkConfig): BenchmarkResult[] {
  const strategies: { key: Strategy; label: string }[] = [
    { key: "random", label: "Random" },
    { key: "roundRobin", label: "Round-robin" },
    { key: "centralizedLB", label: "Centralized LB" },
    { key: "bpe", label: "BPE (Boltzmann)" },
  ];

  return strategies.map(({ key, label }) => {
    const series = runOneStrategy(config, key);
    const n = series.efficiency.length;

    // Average over last 20% of run (steady state)
    const tail = Math.max(1, Math.floor(n * 0.2));
    const avg = (arr: number[]) =>
      arr.slice(-tail).reduce((a, b) => a + b, 0) / tail;

    // Burst recovery: steps after each burst end to return within 5% of pre-burst efficiency
    let recoverySteps = 0;
    if (config.burstMultiplier > 1) {
      for (
        let burst = config.burstDuration;
        burst < config.timesteps;
        burst += config.burstEvery
      ) {
        const preBurst = series.efficiency[Math.max(0, burst - config.burstDuration - 1)] ?? 0.9;
        let recovered = false;
        for (let step = burst; step < Math.min(burst + 50, config.timesteps); step++) {
          if (Math.abs(series.efficiency[step] - preBurst) < 0.05) {
            recoverySteps = Math.max(recoverySteps, step - burst);
            recovered = true;
            break;
          }
        }
        if (!recovered) recoverySteps = 50;
      }
    }

    return {
      strategy: key,
      label,
      series,
      avgEfficiency: avg(series.efficiency),
      avgCompletionRate: avg(series.completionRate),
      avgFairness: avg(series.fairness),
      burstRecoverySteps: recoverySteps,
    };
  });
}
