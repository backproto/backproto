import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
/**
 * Stake tokens into StakeManager.
 * Caller must have approved the StakeManager to spend stakeToken first.
 */
export async function stake(walletClient, addrs, amount) {
    return write(walletClient, {
        address: addrs.stakeManager, abi: abis.StakeManager,
        functionName: "stake", args: [amount],
    });
}
/**
 * Unstake tokens from StakeManager.
 */
export async function unstake(walletClient, addrs, amount) {
    return write(walletClient, {
        address: addrs.stakeManager, abi: abis.StakeManager,
        functionName: "unstake", args: [amount],
    });
}
/**
 * Get current stake for an address.
 */
export async function getStake(publicClient, addrs, sink) {
    return read(publicClient, {
        address: addrs.stakeManager, abi: abis.StakeManager,
        functionName: "getStake", args: [sink],
    });
}
/**
 * Get capacity cap for an address (derived from stake via sqrt).
 */
export async function getCapacityCap(publicClient, addrs, sink) {
    return read(publicClient, {
        address: addrs.stakeManager, abi: abis.StakeManager,
        functionName: "getCapacityCap", args: [sink],
    });
}
/**
 * Get the minimum sink stake requirement.
 */
export async function getMinSinkStake(publicClient, addrs) {
    return read(publicClient, {
        address: addrs.stakeManager, abi: abis.StakeManager,
        functionName: "minSinkStake",
    });
}
