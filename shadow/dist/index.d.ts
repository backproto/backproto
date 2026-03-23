import * as node_http from 'node:http';
import { IncomingMessage, ServerResponse } from 'node:http';

/** Job event recorded by the sidecar. */
interface JobEvent {
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
interface ShadowMetrics {
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
interface SinkMetrics {
    requests: number;
    completions: number;
    failures: number;
    avgLatencyMs: number;
    throughput: number;
}
/**
 * Sliding-window metrics collector backed by a circular buffer.
 * Zero external dependencies.
 */
declare class Collector {
    private buffer;
    private head;
    private count;
    private readonly capacity;
    private readonly windowMs;
    constructor(opts?: {
        windowMs?: number;
        bufferSize?: number;
    });
    /** Record a single job event. */
    record(event: JobEvent): void;
    /** Get aggregated metrics for the current window. */
    getMetrics(now?: number): ShadowMetrics;
    /** Return events within the time window. */
    private getWindowEvents;
    /** Clear all recorded events. */
    reset(): void;
}

/** Configuration for the BPE shadow simulator. */
interface SimulatorConfig {
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
interface SimulationResult {
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
interface SinkComparison {
    actualShare: number;
    bpeShare: number;
    delta: number;
}
/**
 * Port of the BPE simulation logic from bpe_sim.py.
 * Computes what BPE routing/pricing would have done given real metrics.
 */
declare class Simulator {
    private readonly baseFee;
    private readonly gamma;
    private readonly temperature;
    private readonly alpha;
    private smoothedCapacity;
    constructor(config?: SimulatorConfig);
    /** Run a shadow comparison against real metrics. */
    simulate(metrics: ShadowMetrics): SimulationResult;
    /**
     * Boltzmann (soft-max) allocation over smoothed capacities.
     * share_i = exp(cap_i / τ) / Σ exp(cap_j / τ)
     */
    private boltzmannAllocate;
    /**
     * BPE congestion price: baseFee × (1 + γ × queueLoad / capacity)
     * queueLoad approximated from request rate - completion rate.
     */
    private computePrice;
    /** Reset EWMA state. */
    reset(): void;
}

/** Configuration for createShadow(). */
interface ShadowConfig {
    /** Sliding window size in ms. Default: 60000 */
    windowMs?: number;
    /** Circular buffer capacity. Default: 10000 */
    bufferSize?: number;
    /** BPE simulator parameters. */
    simulator?: SimulatorConfig;
}
/** The shadow sidecar instance. */
interface Shadow {
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
interface MiddlewareRequest {
    method?: string;
    url?: string;
    headers?: Record<string, string | string[] | undefined>;
}
interface MiddlewareResponse {
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
declare function createShadow(config?: ShadowConfig): Shadow;

interface ServerConfig {
    port?: number;
    host?: string;
}
/**
 * Starts a lightweight HTTP server exposing shadow metrics.
 *
 * GET /metrics → ShadowMetrics JSON
 * GET /simulate → SimulationResult JSON
 * GET /health → { status: "ok" }
 */
declare function startServer(shadow: Shadow, config?: ServerConfig): node_http.Server<typeof IncomingMessage, typeof ServerResponse>;

export { Collector, type JobEvent, type ServerConfig, type Shadow, type ShadowConfig, type ShadowMetrics, type SimulationResult, Simulator, type SimulatorConfig, type SinkComparison, type SinkMetrics, createShadow, startServer };
