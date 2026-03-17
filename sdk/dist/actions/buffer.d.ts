import { type PublicClient, type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
/**
 * Deposit payment tokens into the overflow buffer for a task type.
 */
export declare function deposit(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash, amount: bigint): Promise<Hash>;
/**
 * Drain buffered funds to sinks with available capacity.
 */
export declare function drain(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash): Promise<Hash>;
/**
 * Get the current buffer level for a task type.
 */
export declare function getBufferLevel(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: Hash): Promise<bigint>;
/**
 * Get the max buffer size for a task type.
 */
export declare function getBufferMax(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: Hash): Promise<bigint>;
