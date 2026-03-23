/** Job event recorded by the sidecar. */
export interface JobEvent {
  type: "request" | "completion" | "failure" | "timeout";
  timestamp: number;
  latencyMs?: number;
  /** NIP-90 kind if applicable (5000-5999). */
  kind?: number;
  /** Provider/sink identifier. */
  sink?: string;
  /** Bytes or tokens processed. */
  units?: number;
}

/** Aggregated metrics for a sliding window. */
export interface ShadowMetrics {
  windowStartMs: number;
  windowEndMs: number;
  totalRequests: number;
  totalCompletions: number;
  totalFailures: number;
  totalTimeouts: number;
  completionRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  throughput: number;
  /** Per-sink breakdown. */
  sinks: Record<string, SinkMetrics>;
}

export interface SinkMetrics {
  requests: number;
  completions: number;
  failures: number;
  avgLatencyMs: number;
  throughput: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_CAPACITY = 10_000;

/**
 * Sliding-window metrics collector backed by a circular buffer.
 * Zero external dependencies.
 */
export class Collector {
  private buffer: JobEvent[];
  private head = 0;
  private count = 0;
  private readonly capacity: number;
  private readonly windowMs: number;

  constructor(opts?: { windowMs?: number; bufferSize?: number }) {
    this.windowMs = opts?.windowMs ?? DEFAULT_WINDOW_MS;
    this.capacity = opts?.bufferSize ?? DEFAULT_CAPACITY;
    this.buffer = new Array(this.capacity);
  }

  /** Record a single job event. */
  record(event: JobEvent): void {
    this.buffer[this.head] = event;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  /** Get aggregated metrics for the current window. */
  getMetrics(now?: number): ShadowMetrics {
    const end = now ?? Date.now();
    const start = end - this.windowMs;

    const events = this.getWindowEvents(start, end);

    let totalRequests = 0;
    let totalCompletions = 0;
    let totalFailures = 0;
    let totalTimeouts = 0;
    const latencies: number[] = [];
    const sinks: Record<string, { reqs: number; comps: number; fails: number; lats: number[]; units: number }> = {};

    for (const e of events) {
      if (e.type === "request") totalRequests++;
      else if (e.type === "completion") {
        totalCompletions++;
        if (e.latencyMs !== undefined) latencies.push(e.latencyMs);
      } else if (e.type === "failure") totalFailures++;
      else if (e.type === "timeout") totalTimeouts++;

      if (e.sink) {
        if (!sinks[e.sink]) sinks[e.sink] = { reqs: 0, comps: 0, fails: 0, lats: [], units: 0 };
        const s = sinks[e.sink];
        if (e.type === "request") s.reqs++;
        else if (e.type === "completion") {
          s.comps++;
          if (e.latencyMs !== undefined) s.lats.push(e.latencyMs);
        } else if (e.type === "failure") s.fails++;
        s.units += e.units ?? 0;
      }
    }

    latencies.sort((a, b) => a - b);
    const windowSec = this.windowMs / 1000;

    const sinkMetrics: Record<string, SinkMetrics> = {};
    for (const [id, s] of Object.entries(sinks)) {
      sinkMetrics[id] = {
        requests: s.reqs,
        completions: s.comps,
        failures: s.fails,
        avgLatencyMs: s.lats.length > 0 ? s.lats.reduce((a, b) => a + b, 0) / s.lats.length : 0,
        throughput: s.comps / windowSec,
      };
    }

    return {
      windowStartMs: start,
      windowEndMs: end,
      totalRequests,
      totalCompletions,
      totalFailures,
      totalTimeouts,
      completionRate: totalRequests > 0 ? totalCompletions / totalRequests : 0,
      avgLatencyMs: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      p95LatencyMs: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0,
      throughput: totalCompletions / windowSec,
      sinks: sinkMetrics,
    };
  }

  /** Return events within the time window. */
  private getWindowEvents(start: number, end: number): JobEvent[] {
    const result: JobEvent[] = [];
    for (let i = 0; i < this.count; i++) {
      const idx = (this.head - this.count + i + this.capacity) % this.capacity;
      const ev = this.buffer[idx];
      if (ev && ev.timestamp >= start && ev.timestamp <= end) {
        result.push(ev);
      }
    }
    return result;
  }

  /** Clear all recorded events. */
  reset(): void {
    this.head = 0;
    this.count = 0;
  }
}
