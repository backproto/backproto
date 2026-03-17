import { type PublicClient, type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
/**
 * Report queue load for a task type at a specific sink.
 */
export declare function reportQueueLoad(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: `0x${string}`, sink: `0x${string}`, queueLoad: bigint): Promise<Hash>;
/**
 * Advance the pricing epoch for a task type, adjusting base fee.
 */
export declare function advancePricingEpoch(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: `0x${string}`): Promise<Hash>;
/**
 * Get the current per-unit price for a task type at a specific sink.
 */
export declare function getPrice(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: `0x${string}`, sink: `0x${string}`): Promise<bigint>;
/**
 * Get the current base fee for a task type.
 */
export declare function getBaseFee(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: `0x${string}`): Promise<bigint>;
/**
 * Get the current queue load for a task type at a specific sink.
 */
export declare function getQueueLoad(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: `0x${string}`, sink: `0x${string}`): Promise<bigint>;
