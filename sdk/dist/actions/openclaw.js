import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
// ──────────────────── Agent Management ────────────────────
export async function registerAgent(walletClient, addrs, agentId, skillTypeId, initialCapacity) {
    return write(walletClient, {
        address: addrs.openClawCapacityAdapter, abi: abis.OpenClawCapacityAdapter,
        functionName: "registerAgent",
        args: [agentId, skillTypeId, [initialCapacity.throughput, initialCapacity.latencyMs, initialCapacity.errorRateBps]],
    });
}
export async function deregisterAgent(walletClient, addrs, agentId) {
    return write(walletClient, {
        address: addrs.openClawCapacityAdapter, abi: abis.OpenClawCapacityAdapter,
        functionName: "deregisterAgent", args: [agentId],
    });
}
// ──────────────────── Capacity Updates ────────────────────
export async function updateCapacity(walletClient, addrs, agentId, capacity) {
    return write(walletClient, {
        address: addrs.openClawCapacityAdapter, abi: abis.OpenClawCapacityAdapter,
        functionName: "updateCapacity",
        args: [agentId, [capacity.throughput, capacity.latencyMs, capacity.errorRateBps]],
    });
}
// ──────────────────── Completion Verification ────────────────────
export async function verifyExecution(walletClient, addrs, agentId, skillTypeId, executionId, agentOperator, agentSig, requesterSig) {
    return write(walletClient, {
        address: addrs.openClawCompletionVerifier, abi: abis.OpenClawCompletionVerifier,
        functionName: "verifyExecution",
        args: [agentId, skillTypeId, executionId, agentOperator, agentSig, requesterSig],
    });
}
// ──────────────────── Reputation Reporting ────────────────────
export async function reportCompletion(walletClient, addrs, operator, skillTypeId) {
    return write(walletClient, {
        address: addrs.openClawReputationBridge, abi: abis.OpenClawReputationBridge,
        functionName: "reportCompletion", args: [operator, skillTypeId],
    });
}
export async function reportFailure(walletClient, addrs, operator, skillTypeId) {
    return write(walletClient, {
        address: addrs.openClawReputationBridge, abi: abis.OpenClawReputationBridge,
        functionName: "reportFailure", args: [operator, skillTypeId],
    });
}
// ──────────────────── Reads ────────────────────
export async function getAgent(publicClient, addrs, agentId) {
    return read(publicClient, {
        address: addrs.openClawCapacityAdapter, abi: abis.OpenClawCapacityAdapter,
        functionName: "getAgent", args: [agentId],
    });
}
export async function getSmoothedCapacity(publicClient, addrs, agentId) {
    return read(publicClient, {
        address: addrs.openClawCapacityAdapter, abi: abis.OpenClawCapacityAdapter,
        functionName: "getSmoothedCapacity", args: [agentId],
    });
}
export async function getAgentsForSkill(publicClient, addrs, skillTypeId) {
    return read(publicClient, {
        address: addrs.openClawCapacityAdapter, abi: abis.OpenClawCapacityAdapter,
        functionName: "getAgentsForSkill", args: [skillTypeId],
    });
}
export async function getOpenClawReputation(publicClient, addrs, operator) {
    return read(publicClient, {
        address: addrs.openClawReputationBridge, abi: abis.OpenClawReputationBridge,
        functionName: "getOpenClawReputation", args: [operator],
    });
}
export async function getOpenClawStakeDiscount(publicClient, addrs, operator) {
    return read(publicClient, {
        address: addrs.openClawReputationBridge, abi: abis.OpenClawReputationBridge,
        functionName: "getStakeDiscount", args: [operator],
    });
}
export async function isExecutionRecorded(publicClient, addrs, executionId) {
    return read(publicClient, {
        address: addrs.openClawCompletionVerifier, abi: abis.OpenClawCompletionVerifier,
        functionName: "isExecutionRecorded", args: [executionId],
    });
}
