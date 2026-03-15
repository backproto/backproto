import { type PublicClient, type WalletClient, type Hash, type Hex } from "viem";
import { abis } from "../abis/index.js";
import type { ChainAddresses } from "../addresses.js";
import { write, read } from "../helpers.js";

/**
 * Record a completion with dual EIP-712 signatures.
 * Must be called by the source (msg.sender = source).
 */
export async function recordCompletion(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  taskTypeId: `0x${string}`,
  sink: `0x${string}`,
  taskId: `0x${string}`,
  sinkSignature: Hex,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.completionTracker, abi: abis.CompletionTracker,
    functionName: "recordCompletion", args: [taskTypeId, sink, taskId, sinkSignature],
  });
}

/**
 * Advance the completion epoch for a task type + sink, triggering slash if needed.
 */
export async function advanceCompletionEpoch(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  taskTypeId: `0x${string}`,
  sink: `0x${string}`,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.completionTracker, abi: abis.CompletionTracker,
    functionName: "advanceEpoch", args: [taskTypeId, sink],
  });
}

/**
 * Get the completion rate (BPS) for a task type + sink in the current epoch.
 */
export async function getCompletionRate(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  taskTypeId: `0x${string}`,
  sink: `0x${string}`,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.completionTracker, abi: abis.CompletionTracker,
    functionName: "getCompletionRate", args: [taskTypeId, sink],
  });
}

/**
 * Get completion count for a task type + sink in the current epoch.
 */
export async function getCompletions(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  taskTypeId: `0x${string}`,
  sink: `0x${string}`,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.completionTracker, abi: abis.CompletionTracker,
    functionName: "getCompletions", args: [taskTypeId, sink],
  });
}
