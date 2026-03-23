import { Collector, type JobEvent, type ShadowMetrics } from "./collector.js";
import { Simulator, type SimulationResult, type SimulatorConfig } from "./simulator.js";

/** Configuration for createShadow(). */
export interface ShadowConfig {
  /** Sliding window size in ms. Default: 60000 */
  windowMs?: number;
  /** Circular buffer capacity. Default: 10000 */
  bufferSize?: number;
  /** BPE simulator parameters. */
  simulator?: SimulatorConfig;
}

/** The shadow sidecar instance. */
export interface Shadow {
  /** Record a job event manually. */
  record(event: JobEvent): void;
  /** Get aggregated metrics for the current window. */
  getMetrics(now?: number): ShadowMetrics;
  /** Run BPE shadow comparison against current metrics. */
  simulate(now?: number): SimulationResult;
  /** Reset all state. */
  reset(): void;
  /**
   * Express/Hono-compatible middleware.
   * Records request/completion events and attaches latency.
   */
  middleware(): (req: MiddlewareRequest, res: MiddlewareResponse, next: () => void) => void;
}

export interface MiddlewareRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
}

export interface MiddlewareResponse {
  on(event: string, listener: () => void): void;
  statusCode?: number;
}

/**
 * Factory: creates a shadow sidecar instance.
 *
 * ```ts
 * import { createShadow } from "@pura/shadow";
 * const shadow = createShadow({ windowMs: 30_000 });
 * shadow.record({ type: "request", timestamp: Date.now(), sink: "dvm-1" });
 * const metrics = shadow.getMetrics();
 * const comparison = shadow.simulate();
 * ```
 */
export function createShadow(config?: ShadowConfig): Shadow {
  const collector = new Collector({
    windowMs: config?.windowMs,
    bufferSize: config?.bufferSize,
  });
  const simulator = new Simulator(config?.simulator);

  return {
    record(event: JobEvent) {
      collector.record(event);
    },

    getMetrics(now?: number) {
      return collector.getMetrics(now);
    },

    simulate(now?: number) {
      const metrics = collector.getMetrics(now);
      return simulator.simulate(metrics);
    },

    reset() {
      collector.reset();
      simulator.reset();
    },

    middleware() {
      return (req: MiddlewareRequest, res: MiddlewareResponse, next: () => void) => {
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
    },
  };
}

function extractSink(req: MiddlewareRequest): string | undefined {
  // Try X-Sink-Id header first, fall back to path-based extraction
  const header = req.headers?.["x-sink-id"];
  if (typeof header === "string" && header.length > 0) return header;
  return undefined;
}
