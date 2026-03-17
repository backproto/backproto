import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
/**
 * Deposit payment tokens into the overflow buffer for a task type.
 */
export async function deposit(walletClient, addrs, taskTypeId, amount) {
    return write(walletClient, {
        address: addrs.escrowBuffer, abi: abis.EscrowBuffer,
        functionName: "deposit", args: [taskTypeId, amount],
    });
}
/**
 * Drain buffered funds to sinks with available capacity.
 */
export async function drain(walletClient, addrs, taskTypeId) {
    return write(walletClient, {
        address: addrs.escrowBuffer, abi: abis.EscrowBuffer,
        functionName: "drain", args: [taskTypeId],
    });
}
/**
 * Get the current buffer level for a task type.
 */
export async function getBufferLevel(publicClient, addrs, taskTypeId) {
    return read(publicClient, {
        address: addrs.escrowBuffer, abi: abis.EscrowBuffer,
        functionName: "bufferLevel", args: [taskTypeId],
    });
}
/**
 * Get the max buffer size for a task type.
 */
export async function getBufferMax(publicClient, addrs, taskTypeId) {
    return read(publicClient, {
        address: addrs.escrowBuffer, abi: abis.EscrowBuffer,
        functionName: "bufferMax", args: [taskTypeId],
    });
}
