import { describe, it, expect, beforeEach } from "vitest";
import { Collector, type JobEvent } from "../src/collector.js";

function makeEvent(
  type: JobEvent["type"],
  timestamp: number,
  opts?: Partial<JobEvent>,
): JobEvent {
  return { type, timestamp, ...opts };
}

describe("Collector", () => {
  let collector: Collector;
  const BASE = 1_700_000_000_000;
  const WINDOW = 10_000;

  beforeEach(() => {
    collector = new Collector({ windowMs: WINDOW, bufferSize: 100 });
  });

  it("returns zeroed metrics with no events", () => {
    const m = collector.getMetrics(BASE);
    expect(m.totalRequests).toBe(0);
    expect(m.totalCompletions).toBe(0);
    expect(m.completionRate).toBe(0);
    expect(m.throughput).toBe(0);
    expect(Object.keys(m.sinks)).toHaveLength(0);
  });

  it("counts request and completion events", () => {
    collector.record(makeEvent("request", BASE - 5000, { sink: "s1" }));
    collector.record(makeEvent("completion", BASE - 4000, { sink: "s1", latencyMs: 120 }));
    collector.record(makeEvent("request", BASE - 3000, { sink: "s1" }));
    collector.record(makeEvent("failure", BASE - 2000, { sink: "s1" }));

    const m = collector.getMetrics(BASE);
    expect(m.totalRequests).toBe(2);
    expect(m.totalCompletions).toBe(1);
    expect(m.totalFailures).toBe(1);
    expect(m.completionRate).toBe(0.5);
  });

  it("computes average and p95 latency", () => {
    for (let i = 0; i < 100; i++) {
      collector.record(makeEvent("completion", BASE - 5000 + i, { latencyMs: i * 10 }));
    }
    const m = collector.getMetrics(BASE);
    expect(m.avgLatencyMs).toBeCloseTo(495, 0);
    expect(m.p95LatencyMs).toBe(950);
  });

  it("excludes events outside the window", () => {
    collector.record(makeEvent("request", BASE - 20000)); // outside
    collector.record(makeEvent("request", BASE - 5000)); // inside
    const m = collector.getMetrics(BASE);
    expect(m.totalRequests).toBe(1);
  });

  it("tracks per-sink metrics", () => {
    collector.record(makeEvent("request", BASE - 5000, { sink: "dvm-1" }));
    collector.record(makeEvent("completion", BASE - 4000, { sink: "dvm-1", latencyMs: 200 }));
    collector.record(makeEvent("request", BASE - 3000, { sink: "relay-1" }));
    collector.record(makeEvent("completion", BASE - 2000, { sink: "relay-1", latencyMs: 50 }));

    const m = collector.getMetrics(BASE);
    expect(Object.keys(m.sinks)).toHaveLength(2);
    expect(m.sinks["dvm-1"].completions).toBe(1);
    expect(m.sinks["dvm-1"].avgLatencyMs).toBe(200);
    expect(m.sinks["relay-1"].avgLatencyMs).toBe(50);
  });

  it("handles circular buffer overflow", () => {
    const small = new Collector({ windowMs: WINDOW, bufferSize: 5 });
    for (let i = 0; i < 10; i++) {
      small.record(makeEvent("request", BASE - 1000 + i));
    }
    // Only last 5 should be in buffer
    const m = small.getMetrics(BASE);
    expect(m.totalRequests).toBe(5);
  });

  it("counts timeout events", () => {
    collector.record(makeEvent("timeout", BASE - 1000, { sink: "s1" }));
    const m = collector.getMetrics(BASE);
    expect(m.totalTimeouts).toBe(1);
  });

  it("calculates throughput as completions per second", () => {
    for (let i = 0; i < 10; i++) {
      collector.record(makeEvent("completion", BASE - 5000 + i * 100, { latencyMs: 50 }));
    }
    const m = collector.getMetrics(BASE);
    // 10 completions in a 10s window = 1.0/sec
    expect(m.throughput).toBe(1.0);
  });

  it("resets clears all events", () => {
    collector.record(makeEvent("request", BASE - 1000));
    collector.reset();
    const m = collector.getMetrics(BASE);
    expect(m.totalRequests).toBe(0);
  });
});
