import { type PublicClient, type WalletClient, type Hash } from "viem";
import { abis } from "../abis/index.js";
import type { ChainAddresses } from "../addresses.js";
import { write, read } from "../helpers.js";

/**
 * Stake tokens into StakeManager.
 * Caller must have approved the StakeManager to spend stakeToken first.
 */
export async function stake(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  amount: bigint,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.stakeManager, abi: abis.StakeManager,
    functionName: "stake", args: [amount],
  });
}

/**
 * Unstake tokens from StakeManager.
 */
export async function unstake(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  amount: bigint,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.stakeManager, abi: abis.StakeManager,
    functionName: "unstake", args: [amount],
  });
}

/**
 * Get current stake for an address.
 */
export async function getStake(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  sink: `0x${string}`,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.stakeManager, abi: abis.StakeManager,
    functionName: "getStake", args: [sink],
  });
}

/**
 * Get capacity cap for an address (derived from stake via sqrt).
 */
export async function getCapacityCap(
  publicClient: PublicClient,
  addrs: ChainAddresses,
  sink: `0x${string}`,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.stakeManager, abi: abis.StakeManager,
    functionName: "getCapacityCap", args: [sink],
  });
}

/**
 * Get the minimum sink stake requirement.
 */
export async function getMinSinkStake(
  publicClient: PublicClient,
  addrs: ChainAddresses,
): Promise<bigint> {
  return read<bigint>(publicClient, {
    address: addrs.stakeManager, abi: abis.StakeManager,
    functionName: "minSinkStake",
  });
}
