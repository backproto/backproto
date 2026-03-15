import { type PublicClient, type WalletClient, type Hash } from "viem";
import { abis } from "../abis/index.js";
import type { ChainAddresses } from "../addresses.js";
import { write, read } from "../helpers.js";

/**
 * Report queue load for a task type at a specific sink.
 */
export async function reportQueueLoad(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  taskTypeId: `0x${string}`,
  sink: `0x${string}`,
  queueLoad: bigint,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.pricingCurve, abi: abis.PricingCurve,
    functionName: "reportQueueLoad", args: [taskTypeId, sink, queueLoad],
  });
}

/**
 * Advance the pricing epoch for a task type, adjusting base fee.
 */
export async function advancePricingEpoch(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  taskTypeId: `0x${string}`,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.pricingCurve, abi: abis.PricingCurve,
    functionName: "advanceEpoch", args: [taskTypeId],
  });
}

/**
 * Get the current per-unit price for a task type at a specific sink.
 */
export async function getPrice(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  taskTypeId: `0x${string}`,
  sink: `0x${string}`,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.pricingCurve, abi: abis.PricingCurve,
    functionName: "getPrice", args: [taskTypeId, sink],
  });
}

/**
 * Get the current base fee for a task type.
 */
export async function getBaseFee(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  taskTypeId: `0x${string}`,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.pricingCurve, abi: abis.PricingCurve,
    functionName: "getBaseFee", args: [taskTypeId],
  });
}

/**
 * Get the current queue load for a task type at a specific sink.
 */
export async function getQueueLoad(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  taskTypeId: `0x${string}`,
  sink: `0x${string}`,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.pricingCurve, abi: abis.PricingCurve,
    functionName: "getQueueLoad", args: [taskTypeId, sink],
  });
}
