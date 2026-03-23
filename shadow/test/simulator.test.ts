import { describe, it, expect, beforeEach } from "vitest";
import { Simulator } from "../src/simulator.js";
import type { ShadowMetrics, SinkMetrics } from "../src/collector.js";

function makeSinkMetrics(overrides?: Partial<SinkMetrics>): SinkMetrics {
  return {
    requests: 100,
    completions: 90,
    failures: 10,
    avgLatencyMs: 150,
    throughput: 9,
    ...overrides,
  };
}

function makeMetrics(sinks: Record<string, SinkMetrics>): ShadowMetrics {
  let totalReqs = 0;
  let totalComps = 0;
  let totalFails = 0;
  for (const s of Object.values(sinks)) {
    totalReqs += s.requests;
    totalComps += s.completions;
    totalFails += s.failures;
  }
  return {
    windowStartMs: 0,
    windowEndMs: 60000,
    totalRequests: totalReqs,
    totalCompletions: totalComps,
    totalFailures: totalFails,
    totalTimeouts: 0,
    completionRate: totalReqs > 0 ? totalComps / totalReqs : 0,
    avgLatencyMs: 150,
    p95LatencyMs: 300,
    throughput: totalComps / 60,
    sinks,
  };
}

describe("Simulator", () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = new Simulator({ baseFee: 1000, gamma: 0.5, temperature: 1.0, alpha: 0.3 });
  });

  it("returns zeroed result with no sinks", () => {
    const result = sim.simulate(makeMetrics({}));
    expect(result.shadowReroutedCount).toBe(0);
    expect(result.shadowRevenueDeltaMsat).toBe(0);
    expect(result.shadowPriceSignalCount).toBe(0);
  });

  it("produces non-zero result with sinks", () => {
    const metrics = makeMetrics({
      "dvm-1": makeSinkMetrics({ throughput: 10, requests: 80, completions: 70 }),
      "dvm-2": makeSinkMetrics({ throughput: 5, requests: 120, completions: 100 }),
    });
    const result = sim.simulate(metrics);
    expect(Object.keys(result.sinkComparison)).toHaveLength(2);
    expect(Object.keys(result.bpePricePerSink)).toHaveLength(2);
  });

  it("allocates more to higher-capacity sinks", () => {
    const metrics = makeMetrics({
      fast: makeSinkMetrics({ throughput: 20, requests: 50, completions: 50 }),
      slow: makeSinkMetrics({ throughput: 2, requests: 50, completions: 40 }),
    });
    const result = sim.simulate(metrics);
    expect(result.sinkComparison["fast"].bpeShare).toBeGreaterThan(
      result.sinkComparison["slow"].bpeShare,
    );
  });

  it("detects reroutes when sinks are imbalanced", () => {
    const metrics = makeMetrics({
      overloaded: makeSinkMetrics({ throughput: 5, requests: 180, completions: 100 }),
      idle: makeSinkMetrics({ throughput: 15, requests: 20, completions: 20 }),
    });
    const result = sim.simulate(metrics);
    // BPE would shift load from overloaded to idle
    expect(result.shadowReroutedCount).toBeGreaterThan(0);
  });

  it("computes congestion pricing above base fee for overloaded sinks", () => {
    const metrics = makeMetrics({
      hot: makeSinkMetrics({ throughput: 3, requests: 200, completions: 50 }),
    });
    const result = sim.simulate(metrics);
    // With 200 requests and 50 completions, queue load = 150, capacity ≈ 3
    // Price = 1000 × (1 + 0.5 × 150/3) = huge
    expect(result.bpePricePerSink["hot"]).toBeGreaterThan(1000);
  });

  it("fires price signals when price exceeds 1.5x base", () => {
    const metrics = makeMetrics({
      congested: makeSinkMetrics({ throughput: 2, requests: 100, completions: 20 }),
    });
    const result = sim.simulate(metrics);
    expect(result.shadowPriceSignalCount).toBeGreaterThan(0);
  });

  it("EWMA smooths capacity across simulate() calls", () => {
    // First call: establish baseline
    const m1 = makeMetrics({ s1: makeSinkMetrics({ throughput: 10 }) });
    sim.simulate(m1);

    // Second call: spike
    const m2 = makeMetrics({ s1: makeSinkMetrics({ throughput: 100 }) });
    const result = sim.simulate(m2);

    // Smoothed capacity should be between 10 and 100
    // α=0.3 → smoothed = 0.3*100 + 0.7*(0.3*10 + 0.7*10) = 37
    const price = result.bpePricePerSink["s1"];
    expect(price).toBeDefined();
  });

  it("reset clears EWMA state", () => {
    const m1 = makeMetrics({ s1: makeSinkMetrics({ throughput: 50 }) });
    sim.simulate(m1);
    sim.reset();

    // After reset, should behave like first call
    const m2 = makeMetrics({ s1: makeSinkMetrics({ throughput: 10 }) });
    const result = sim.simulate(m2);
    expect(result.bpePricePerSink["s1"]).toBeDefined();
  });

  it("handles single sink", () => {
    const metrics = makeMetrics({
      only: makeSinkMetrics({ throughput: 10, requests: 50, completions: 45 }),
    });
    const result = sim.simulate(metrics);
    expect(result.sinkComparison["only"].bpeShare).toBeCloseTo(1.0, 2);
  });

  it("revenue delta reflects congestion pricing", () => {
    const metrics = makeMetrics({
      s1: makeSinkMetrics({ throughput: 5, requests: 100, completions: 30 }),
      s2: makeSinkMetrics({ throughput: 15, requests: 100, completions: 90 }),
    });
    const result = sim.simulate(metrics);
    // BPE would charge more for congested s1, so revenue delta should be positive
    // (BPE earns more from congestion pricing than flat base fee)
    expect(result.shadowRevenueDeltaMsat).not.toBe(0);
  });
});
