import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
/**
 * Register a new task type in the CapacityRegistry.
 */
export async function registerTaskType(walletClient, addrs, taskTypeId, minStake) {
    return write(walletClient, {
        address: addrs.capacityRegistry, abi: abis.CapacityRegistry,
        functionName: "registerTaskType", args: [taskTypeId, minStake],
    });
}
/**
 * Start a GDA distribution flow to a task type's pool.
 * The caller must have wrapped SuperTokens (tUSDCx) to fund the flow.
 */
export async function startStream(walletClient, addrs, poolAddress, flowRate) {
    return write(walletClient, {
        address: addrs.gdaV1Forwarder, abi: abis.GDAv1Forwarder,
        functionName: "distributeFlow",
        args: [addrs.paymentSuperToken, walletClient.account.address, poolAddress, flowRate, "0x"],
    });
}
/**
 * Stop a GDA distribution flow (set flow rate to 0).
 */
export async function stopStream(walletClient, addrs, poolAddress) {
    return startStream(walletClient, addrs, poolAddress, 0n);
}
/**
 * Get the current flow rate from a distributor to a pool.
 */
export async function getFlowRate(publicClient, addrs, from, poolAddress) {
    return read(publicClient, {
        address: addrs.gdaV1Forwarder, abi: abis.GDAv1Forwarder,
        functionName: "getFlowDistributionFlowRate",
        args: [addrs.paymentSuperToken, from, poolAddress],
    });
}
/**
 * Get net flow for an account (sum of all inflows and outflows).
 */
export async function getNetFlow(publicClient, addrs, account) {
    return read(publicClient, {
        address: addrs.gdaV1Forwarder, abi: abis.GDAv1Forwarder,
        functionName: "getNetFlow", args: [addrs.paymentSuperToken, account],
    });
}
