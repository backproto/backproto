import { type PublicClient, type WalletClient, type Hash } from "viem";
import { abis } from "../abis/index.js";
import type { ChainAddresses } from "../addresses.js";
import { write, read } from "../helpers.js";

/**
 * Create a Superfluid GDA pool for a task type.
 */
export async function createPool(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  taskTypeId: Hash,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.backpressurePool, abi: abis.BackpressurePool,
    functionName: "createPool", args: [taskTypeId],
  });
}

/**
 * Trigger a rebalance of pool member units based on current capacity signals.
 */
export async function rebalance(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  taskTypeId: Hash,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.backpressurePool, abi: abis.BackpressurePool,
    functionName: "rebalance", args: [taskTypeId],
  });
}

/**
 * Check if a rebalance is needed for a task type.
 */
export async function needsRebalance(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  taskTypeId: Hash,
): Promise<boolean> {
  return read<boolean>(publicClient, {
    address: addrs.backpressurePool, abi: abis.BackpressurePool,
    functionName: "needsRebalance", args: [taskTypeId],
  });
}

/**
 * Get the Superfluid pool address for a task type.
 */
export async function getPoolAddress(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  taskTypeId: Hash,
): Promise<`0x${string}`> {
  return read<`0x${string}`>(publicClient, {
    address: addrs.backpressurePool, abi: abis.BackpressurePool,
    functionName: "getPool", args: [taskTypeId],
  });
}

/**
 * Get member units for a sink in a pool.
 */
export async function getMemberUnits(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  taskTypeId: Hash,
  sink: `0x${string}`,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.backpressurePool, abi: abis.BackpressurePool,
    functionName: "getMemberUnits", args: [taskTypeId, sink],
  });
}

/**
 * Get task type info from the registry.
 */
export async function getTaskType(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  taskTypeId: Hash,
): Promise<{ minStake: bigint; sinkCount: bigint; totalCapacity: bigint }> {
  const result = await read<[bigint, bigint, bigint]>(publicClient, {
    address: addrs.capacityRegistry, abi: abis.CapacityRegistry,
    functionName: "getTaskType", args: [taskTypeId],
  });
  return { minStake: result[0], sinkCount: result[1], totalCapacity: result[2] };
}
