// src/collector.ts
var DEFAULT_WINDOW_MS = 6e4;
var DEFAULT_CAPACITY = 1e4;
var Collector = class {
  buffer;
  head = 0;
  count = 0;
  capacity;
  windowMs;
  constructor(opts) {
    this.windowMs = opts?.windowMs ?? DEFAULT_WINDOW_MS;
    this.capacity = opts?.bufferSize ?? DEFAULT_CAPACITY;
    this.buffer = new Array(this.capacity);
  }
  /** Record a single job event. */
  record(event) {
    this.buffer[this.head] = event;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }
  /** Get aggregated metrics for the current window. */
  getMetrics(now) {
    const end = now ?? Date.now();
    const start = end - this.windowMs;
    const events = this.getWindowEvents(start, end);
    let totalRequests = 0;
    let totalCompletions = 0;
    let totalFailures = 0;
    let totalTimeouts = 0;
    const latencies = [];
    const sinks = {};
    for (const e of events) {
      if (e.type === "request") totalRequests++;
      else if (e.type === "completion") {
        totalCompletions++;
        if (e.latencyMs !== void 0) latencies.push(e.latencyMs);
      } else if (e.type === "failure") totalFailures++;
      else if (e.type === "timeout") totalTimeouts++;
      if (e.sink) {
        if (!sinks[e.sink]) sinks[e.sink] = { reqs: 0, comps: 0, fails: 0, lats: [], units: 0 };
        const s = sinks[e.sink];
        if (e.type === "request") s.reqs++;
        else if (e.type === "completion") {
          s.comps++;
          if (e.latencyMs !== void 0) s.lats.push(e.latencyMs);
        } else if (e.type === "failure") s.fails++;
        s.units += e.units ?? 0;
      }
    }
    latencies.sort((a, b) => a - b);
    const windowSec = this.windowMs / 1e3;
    const sinkMetrics = {};
    for (const [id, s] of Object.entries(sinks)) {
      sinkMetrics[id] = {
        requests: s.reqs,
        completions: s.comps,
        failures: s.fails,
        avgLatencyMs: s.lats.length > 0 ? s.lats.reduce((a, b) => a + b, 0) / s.lats.length : 0,
        throughput: s.comps / windowSec
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
      sinks: sinkMetrics
    };
  }
  /** Return events within the time window. */
  getWindowEvents(start, end) {
    const result = [];
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
  reset() {
    this.head = 0;
    this.count = 0;
  }
};

// src/simulator.ts
var Simulator = class {
  baseFee;
  gamma;
  temperature;
  alpha;
  smoothedCapacity = {};
  constructor(config) {
    this.baseFee = config?.baseFee ?? 1e3;
    this.gamma = config?.gamma ?? 0.5;
    this.temperature = config?.temperature ?? 1;
    this.alpha = config?.alpha ?? 0.3;
  }
  /** Run a shadow comparison against real metrics. */
  simulate(metrics) {
    const sinkIds = Object.keys(metrics.sinks);
    if (sinkIds.length === 0) {
      return {
        shadowReroutedCount: 0,
        shadowRevenueDeltaMsat: 0,
        shadowPriceSignalCount: 0,
        sinkComparison: {},
        bpePricePerSink: {}
      };
    }
    for (const id of sinkIds) {
      const sink = metrics.sinks[id];
      const raw = sink.throughput;
      const prev = this.smoothedCapacity[id] ?? raw;
      this.smoothedCapacity[id] = this.alpha * raw + (1 - this.alpha) * prev;
    }
    const bpeShares = this.boltzmannAllocate(sinkIds);
    const totalRequests = metrics.totalRequests || 1;
    const actualShares = {};
    for (const id of sinkIds) {
      actualShares[id] = metrics.sinks[id].requests / totalRequests;
    }
    let rerouteCount = 0;
    let priceSignalCount = 0;
    const sinkComparison = {};
    const bpePricePerSink = {};
    for (const id of sinkIds) {
      const actual = actualShares[id] ?? 0;
      const bpe = bpeShares[id] ?? 0;
      const delta = bpe - actual;
      sinkComparison[id] = { actualShare: actual, bpeShare: bpe, delta };
      if (delta < -0.01) {
        rerouteCount += Math.round(Math.abs(delta) * totalRequests);
      }
      const price = this.computePrice(id, metrics.sinks[id]);
      bpePricePerSink[id] = price;
      if (price > this.baseFee * 1.5) {
        priceSignalCount++;
      }
    }
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
      bpePricePerSink
    };
  }
  /**
   * Boltzmann (soft-max) allocation over smoothed capacities.
   * share_i = exp(cap_i / τ) / Σ exp(cap_j / τ)
   */
  boltzmannAllocate(sinkIds) {
    const shares = {};
    const caps = sinkIds.map((id) => this.smoothedCapacity[id] ?? 0);
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
  computePrice(sinkId, sink) {
    const capacity = this.smoothedCapacity[sinkId] || 1;
    const queueLoad = Math.max(0, sink.requests - sink.completions);
    return Math.round(this.baseFee * (1 + this.gamma * (queueLoad / capacity)));
  }
  /** Reset EWMA state. */
  reset() {
    this.smoothedCapacity = {};
  }
};

// src/shadow.ts
function createShadow(config) {
  const collector = new Collector({
    windowMs: config?.windowMs,
    bufferSize: config?.bufferSize
  });
  const simulator = new Simulator(config?.simulator);
  return {
    record(event) {
      collector.record(event);
    },
    getMetrics(now) {
      return collector.getMetrics(now);
    },
    simulate(now) {
      const metrics = collector.getMetrics(now);
      return simulator.simulate(metrics);
    },
    reset() {
      collector.reset();
      simulator.reset();
    },
    middleware() {
      return (req, res, next) => {
        const start = Date.now();
        const sink = extractSink(req);
        collector.record({ type: "request", timestamp: start, sink });
        res.on("finish", () => {
          const latencyMs = Date.now() - start;
          const status = res.statusCode ?? 200;
          const type = status >= 500 ? "failure" : status === 408 ? "timeout" : "completion";
          collector.record({ type, timestamp: Date.now(), latencyMs, sink });
        });
        next();
      };
    }
  };
}
function extractSink(req) {
  const header = req.headers?.["x-sink-id"];
  if (typeof header === "string" && header.length > 0) return header;
  return void 0;
}

// src/server.ts
import { createServer } from "http";
function startServer(shadow, config) {
  const port = config?.port ?? 3099;
  const host = config?.host ?? "127.0.0.1";
  const server = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/metrics" && req.method === "GET") {
      const metrics = shadow.getMetrics();
      res.writeHead(200);
      res.end(JSON.stringify(metrics));
    } else if (req.url === "/simulate" && req.method === "GET") {
      const result = shadow.simulate();
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } else if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok" }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "not found" }));
    }
  });
  server.listen(port, host);
  return server;
}
export {
  Collector,
  Simulator,
  createShadow,
  startServer
};
//# sourceMappingURL=index.js.map