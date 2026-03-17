import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
/**
 * Report queue load for a task type at a specific sink.
 */
export async function reportQueueLoad(walletClient, addrs, taskTypeId, sink, queueLoad) {
    return write(walletClient, {
        address: addrs.pricingCurve, abi: abis.PricingCurve,
        functionName: "reportQueueLoad", args: [taskTypeId, sink, queueLoad],
    });
}
/**
 * Advance the pricing epoch for a task type, adjusting base fee.
 */
export async function advancePricingEpoch(walletClient, addrs, taskTypeId) {
    return write(walletClient, {
        address: addrs.pricingCurve, abi: abis.PricingCurve,
        functionName: "advanceEpoch", args: [taskTypeId],
    });
}
/**
 * Get the current per-unit price for a task type at a specific sink.
 */
export async function getPrice(publicClient, addrs, taskTypeId, sink) {
    return read(publicClient, {
        address: addrs.pricingCurve, abi: abis.PricingCurve,
        functionName: "getPrice", args: [taskTypeId, sink],
    });
}
/**
 * Get the current base fee for a task type.
 */
export async function getBaseFee(publicClient, addrs, taskTypeId) {
    return read(publicClient, {
        address: addrs.pricingCurve, abi: abis.PricingCurve,
        functionName: "getBaseFee", args: [taskTypeId],
    });
}
/**
 * Get the current queue load for a task type at a specific sink.
 */
export async function getQueueLoad(publicClient, addrs, taskTypeId, sink) {
    return read(publicClient, {
        address: addrs.pricingCurve, abi: abis.PricingCurve,
        functionName: "getQueueLoad", args: [taskTypeId, sink],
    });
}
