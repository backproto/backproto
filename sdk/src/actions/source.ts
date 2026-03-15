import { type PublicClient, type WalletClient, type Hash } from "viem";
import { abis } from "../abis/index.js";
import type { ChainAddresses } from "../addresses.js";
import { write, read } from "../helpers.js";

/**
 * Register a new task type in the CapacityRegistry.
 */
export async function registerTaskType(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  taskTypeId: Hash,
  minStake: bigint,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.capacityRegistry, abi: abis.CapacityRegistry,
    functionName: "registerTaskType", args: [taskTypeId, minStake],
  });
}

/**
 * Start a GDA distribution flow to a task type's pool.
 * The caller must have wrapped SuperTokens (tUSDCx) to fund the flow.
 */
export async function startStream(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  poolAddress: `0x${string}`,
  flowRate: bigint,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.gdaV1Forwarder, abi: abis.GDAv1Forwarder,
    functionName: "distributeFlow",
    args: [addrs.paymentSuperToken, walletClient.account!.address, poolAddress, flowRate, "0x"],
  });
}

/**
 * Stop a GDA distribution flow (set flow rate to 0).
 */
export async function stopStream(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  poolAddress: `0x${string}`,
): Promise<Hash> {
  return startStream(walletClient, addrs, poolAddress, 0n);
}

/**
 * Get the current flow rate from a distributor to a pool.
 */
export async function getFlowRate(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  from: `0x${string}`,
  poolAddress: `0x${string}`,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.gdaV1Forwarder, abi: abis.GDAv1Forwarder,
    functionName: "getFlowDistributionFlowRate",
    args: [addrs.paymentSuperToken, from, poolAddress],
  });
}

/**
 * Get net flow for an account (sum of all inflows and outflows).
 */
export async function getNetFlow(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  account: `0x${string}`,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.gdaV1Forwarder, abi: abis.GDAv1Forwarder,
    functionName: "getNetFlow", args: [addrs.paymentSuperToken, account],
  });
}
