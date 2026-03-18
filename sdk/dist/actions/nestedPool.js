import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
/**
 * Register a child pool under a parent task type in the hierarchy.
 */
export async function registerChild(walletClient, addrs, parentTaskTypeId, childTaskTypeId) {
    return write(walletClient, {
        address: addrs.nestedPool, abi: abis.NestedPool,
        functionName: "registerChild", args: [parentTaskTypeId, childTaskTypeId],
    });
}
/**
 * Deregister a child pool from a parent task type.
 */
export async function deregisterChild(walletClient, addrs, parentTaskTypeId, childTaskTypeId) {
    return write(walletClient, {
        address: addrs.nestedPool, abi: abis.NestedPool,
        functionName: "deregisterChild", args: [parentTaskTypeId, childTaskTypeId],
    });
}
/**
 * Trigger a bottom-up hierarchical rebalance starting from a task type.
 */
export async function rebalanceHierarchy(walletClient, addrs, taskTypeId, maxDepth) {
    return write(walletClient, {
        address: addrs.nestedPool, abi: abis.NestedPool,
        functionName: "rebalanceHierarchy", args: [taskTypeId, maxDepth],
    });
}
/**
 * Check if a task type is a child of another.
 */
export async function isChildPool(publicClient, addrs, parentTaskTypeId, childTaskTypeId) {
    return read(publicClient, {
        address: addrs.nestedPool, abi: abis.NestedPool,
        functionName: "isChildPool", args: [parentTaskTypeId, childTaskTypeId],
    });
}
/**
 * Get the effective capacity of a task type (includes child pool capacity).
 */
export async function getEffectiveCapacity(publicClient, addrs, taskTypeId) {
    return read(publicClient, {
        address: addrs.nestedPool, abi: abis.NestedPool,
        functionName: "getEffectiveCapacity", args: [taskTypeId],
    });
}
/**
 * Get all child task type IDs for a parent.
 */
export async function getChildren(publicClient, addrs, parentTaskTypeId) {
    return read(publicClient, {
        address: addrs.nestedPool, abi: abis.NestedPool,
        functionName: "getChildren", args: [parentTaskTypeId],
    });
}
