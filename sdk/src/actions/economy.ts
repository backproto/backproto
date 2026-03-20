import { type PublicClient, type WalletClient, type Hash } from "viem";
import { abis } from "../abis/index.js";
import type { ChainAddresses } from "../addresses.js";
import { write, read } from "../helpers.js";

/** Template enum matching the Solidity EconomyFactory.Template. */
export const Template = {
  MARKETPLACE: 0,
  COOPERATIVE: 1,
  PIPELINE: 2,
  GUILD: 3,
} as const;

export type EconomyConfig = {
  template: (typeof Template)[keyof typeof Template];
  taskTypeIds: Hash[];
  minStake: bigint;
  bufferMax: bigint;
  verificationBudgetBps: bigint;
};

export type EconomyDeployment = {
  economyId: Hash;
  stakeManager: `0x${string}`;
  capacityRegistry: `0x${string}`;
  backpressurePool: `0x${string}`;
  escrowBuffer: `0x${string}`;
  pricingCurve: `0x${string}`;
  pipeline: `0x${string}`;
  owner: `0x${string}`;
};

/**
 * Deploy a complete BPE economy in a single transaction.
 */
export async function deployEconomy(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  config: EconomyConfig,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.economyFactory, abi: abis.EconomyFactory,
    functionName: "deployEconomy",
    args: [config],
  });
}

/**
 * Get the deployment record for an economy.
 */
export async function getEconomy(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  economyId: Hash,
): Promise<EconomyDeployment> {
  return read<EconomyDeployment>(publicClient, {
    address: addrs.economyFactory, abi: abis.EconomyFactory,
    functionName: "getEconomy", args: [economyId],
  });
}

/**
 * Get all economy IDs owned by an address.
 */
export async function getEconomiesByOwner(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  owner: `0x${string}`,
): Promise<Hash[]> {
  return read<Hash[]>(publicClient, {
    address: addrs.economyFactory, abi: abis.EconomyFactory,
    functionName: "getEconomiesByOwner", args: [owner],
  });
}

/**
 * Get the total number of deployed economies.
 */
export async function economyCount(
  publicClient: PublicClient,
  addrs: ChainAddresses,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.economyFactory, abi: abis.EconomyFactory,
    functionName: "economyCount",
  });
}
