import { type PublicClient, type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
/**
 * Stake tokens into StakeManager.
 * Caller must have approved the StakeManager to spend stakeToken first.
 */
export declare function stake(walletClient: WalletClient, addrs: ChainAddresses, amount: bigint): Promise<Hash>;
/**
 * Unstake tokens from StakeManager.
 */
export declare function unstake(walletClient: WalletClient, addrs: ChainAddresses, amount: bigint): Promise<Hash>;
/**
 * Get current stake for an address.
 */
export declare function getStake(publicClient: PublicClient, addrs: ChainAddresses, sink: `0x${string}`): Promise<bigint>;
/**
 * Get capacity cap for an address (derived from stake via sqrt).
 */
export declare function getCapacityCap(publicClient: PublicClient, addrs: ChainAddresses, sink: `0x${string}`): Promise<bigint>;
/**
 * Get the minimum sink stake requirement.
 */
export declare function getMinSinkStake(publicClient: PublicClient, addrs: ChainAddresses): Promise<bigint>;
