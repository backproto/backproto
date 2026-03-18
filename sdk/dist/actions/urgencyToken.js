import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
/**
 * Mint urgency tokens with a TTL. Underlying tokens are locked.
 */
export async function mint(walletClient, addrs, amount, ttlSeconds) {
    return write(walletClient, {
        address: addrs.urgencyToken, abi: abis.UrgencyToken,
        functionName: "mint", args: [amount, ttlSeconds],
    });
}
/**
 * Consume an urgency deposit by routing it to a sink (authorized consumers only).
 */
export async function consume(walletClient, addrs, depositId, sink) {
    return write(walletClient, {
        address: addrs.urgencyToken, abi: abis.UrgencyToken,
        functionName: "consume", args: [depositId, sink],
    });
}
/**
 * Burn an expired deposit.
 */
export async function burn(walletClient, addrs, depositId) {
    return write(walletClient, {
        address: addrs.urgencyToken, abi: abis.UrgencyToken,
        functionName: "burn", args: [depositId],
    });
}
/**
 * Batch-burn expired deposits.
 */
export async function batchBurn(walletClient, addrs, depositIds) {
    return write(walletClient, {
        address: addrs.urgencyToken, abi: abis.UrgencyToken,
        functionName: "batchBurn", args: [depositIds],
    });
}
/**
 * Get deposit details.
 */
export async function getDeposit(publicClient, addrs, depositId) {
    return read(publicClient, {
        address: addrs.urgencyToken, abi: abis.UrgencyToken,
        functionName: "getDeposit", args: [depositId],
    });
}
/**
 * Check if a deposit has expired.
 */
export async function isExpired(publicClient, addrs, depositId) {
    return read(publicClient, {
        address: addrs.urgencyToken, abi: abis.UrgencyToken,
        functionName: "isExpired", args: [depositId],
    });
}
/**
 * Get remaining TTL in seconds (0 if expired).
 */
export async function remainingTTL(publicClient, addrs, depositId) {
    return read(publicClient, {
        address: addrs.urgencyToken, abi: abis.UrgencyToken,
        functionName: "remainingTTL", args: [depositId],
    });
}
/**
 * Get total active urgency deposits.
 */
export async function totalActive(publicClient, addrs) {
    return read(publicClient, {
        address: addrs.urgencyToken, abi: abis.UrgencyToken,
        functionName: "totalActive",
    });
}
/**
 * Get total burned urgency deposits.
 */
export async function totalBurned(publicClient, addrs) {
    return read(publicClient, {
        address: addrs.urgencyToken, abi: abis.UrgencyToken,
        functionName: "totalBurned",
    });
}
