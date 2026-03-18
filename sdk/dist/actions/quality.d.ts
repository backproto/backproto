import { type PublicClient, type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
export type QualityMetrics = {
    completionRate: bigint;
    avgLatencyMs: bigint;
    errorRateBps: bigint;
    satisfactionBps: bigint;
    qualityScore: bigint;
    lastUpdated: bigint;
};
/**
 * Report task completion latency for a sink.
 */
export declare function reportLatency(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash, sink: `0x${string}`, latencyMs: bigint): Promise<Hash>;
/**
 * Report a task error for a sink.
 */
export declare function reportError(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash, sink: `0x${string}`, taskId: Hash): Promise<Hash>;
/**
 * Report consumer satisfaction score (0-10000 BPS).
 */
export declare function reportSatisfaction(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash, sink: `0x${string}`, scoreBps: bigint): Promise<Hash>;
/**
 * Compute and update the composite quality score for a sink.
 */
export declare function computeQuality(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash, sink: `0x${string}`): Promise<Hash>;
/**
 * Get the full quality metrics for a sink.
 */
export declare function getQualityMetrics(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: Hash, sink: `0x${string}`): Promise<QualityMetrics>;
/**
 * Get the composite quality score (0-10000 BPS).
 */
export declare function getQualityScore(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: Hash, sink: `0x${string}`): Promise<bigint>;
/**
 * Get the quality-weighted effective capacity.
 */
export declare function getEffectiveCapacity(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: Hash, sink: `0x${string}`): Promise<bigint>;
