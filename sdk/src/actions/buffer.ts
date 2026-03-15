import { type PublicClient, type WalletClient, type Hash } from "viem";
import { abis } from "../abis/index.js";
import type { ChainAddresses } from "../addresses.js";
import { write, read } from "../helpers.js";

/**
 * Deposit payment tokens into the overflow buffer for a task type.
 */
export async function deposit(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  taskTypeId: Hash,
  amount: bigint,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.escrowBuffer, abi: abis.EscrowBuffer,
    functionName: "deposit", args: [taskTypeId, amount],
  });
}

/**
 * Drain buffered funds to sinks with available capacity.
 */
export async function drain(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  taskTypeId: Hash,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.escrowBuffer, abi: abis.EscrowBuffer,
    functionName: "drain", args: [taskTypeId],
  });
}

/**
 * Get the current buffer level for a task type.
 */
export async function getBufferLevel(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  taskTypeId: Hash,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.escrowBuffer, abi: abis.EscrowBuffer,
    functionName: "bufferLevel", args: [taskTypeId],
  });
}

/**
 * Get the max buffer size for a task type.
 */
export async function getBufferMax(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  taskTypeId: Hash,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.escrowBuffer, abi: abis.EscrowBuffer,
    functionName: "bufferMax", args: [taskTypeId],
  });
}
