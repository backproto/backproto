import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
/**
 * Create a Superfluid GDA pool for a task type.
 */
export async function createPool(walletClient, addrs, taskTypeId) {
    return write(walletClient, {
        address: addrs.backpressurePool, abi: abis.BackpressurePool,
        functionName: "createPool", args: [taskTypeId],
    });
}
/**
 * Trigger a rebalance of pool member units based on current capacity signals.
 */
export async function rebalance(walletClient, addrs, taskTypeId) {
    return write(walletClient, {
        address: addrs.backpressurePool, abi: abis.BackpressurePool,
        functionName: "rebalance", args: [taskTypeId],
    });
}
/**
 * Check if a rebalance is needed for a task type.
 */
export async function needsRebalance(publicClient, addrs, taskTypeId) {
    return read(publicClient, {
        address: addrs.backpressurePool, abi: abis.BackpressurePool,
        functionName: "needsRebalance", args: [taskTypeId],
    });
}
/**
 * Get the Superfluid pool address for a task type.
 */
export async function getPoolAddress(publicClient, addrs, taskTypeId) {
    return read(publicClient, {
        address: addrs.backpressurePool, abi: abis.BackpressurePool,
        functionName: "getPool", args: [taskTypeId],
    });
}
/**
 * Get member units for a sink in a pool.
 */
export async function getMemberUnits(publicClient, addrs, taskTypeId, sink) {
    return read(publicClient, {
        address: addrs.backpressurePool, abi: abis.BackpressurePool,
        functionName: "getMemberUnits", args: [taskTypeId, sink],
    });
}
/**
 * Get task type info from the registry.
 */
export async function getTaskType(publicClient, addrs, taskTypeId) {
    const result = await read(publicClient, {
        address: addrs.capacityRegistry, abi: abis.CapacityRegistry,
        functionName: "getTaskType", args: [taskTypeId],
    });
    return { minStake: result[0], sinkCount: result[1], totalCapacity: result[2] };
}
