import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
/**
 * Report task completion latency for a sink.
 */
export async function reportLatency(walletClient, addrs, taskTypeId, sink, latencyMs) {
    return write(walletClient, {
        address: addrs.qualityOracle, abi: abis.QualityOracle,
        functionName: "reportLatency", args: [taskTypeId, sink, latencyMs],
    });
}
/**
 * Report a task error for a sink.
 */
export async function reportError(walletClient, addrs, taskTypeId, sink, taskId) {
    return write(walletClient, {
        address: addrs.qualityOracle, abi: abis.QualityOracle,
        functionName: "reportError", args: [taskTypeId, sink, taskId],
    });
}
/**
 * Report consumer satisfaction score (0-10000 BPS).
 */
export async function reportSatisfaction(walletClient, addrs, taskTypeId, sink, scoreBps) {
    return write(walletClient, {
        address: addrs.qualityOracle, abi: abis.QualityOracle,
        functionName: "reportSatisfaction", args: [taskTypeId, sink, scoreBps],
    });
}
/**
 * Compute and update the composite quality score for a sink.
 */
export async function computeQuality(walletClient, addrs, taskTypeId, sink) {
    return write(walletClient, {
        address: addrs.qualityOracle, abi: abis.QualityOracle,
        functionName: "computeQuality", args: [taskTypeId, sink],
    });
}
/**
 * Get the full quality metrics for a sink.
 */
export async function getQualityMetrics(publicClient, addrs, taskTypeId, sink) {
    return read(publicClient, {
        address: addrs.qualityOracle, abi: abis.QualityOracle,
        functionName: "getQualityMetrics", args: [taskTypeId, sink],
    });
}
/**
 * Get the composite quality score (0-10000 BPS).
 */
export async function getQualityScore(publicClient, addrs, taskTypeId, sink) {
    return read(publicClient, {
        address: addrs.qualityOracle, abi: abis.QualityOracle,
        functionName: "getQualityScore", args: [taskTypeId, sink],
    });
}
/**
 * Get the quality-weighted effective capacity.
 */
export async function getEffectiveCapacity(publicClient, addrs, taskTypeId, sink) {
    return read(publicClient, {
        address: addrs.qualityOracle, abi: abis.QualityOracle,
        functionName: "getEffectiveCapacity", args: [taskTypeId, sink],
    });
}
