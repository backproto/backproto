import { type PublicClient, type WalletClient, type Hash, type Hex } from "viem";
import type { ChainAddresses } from "../addresses.js";
/**
 * Record a completion with dual EIP-712 signatures.
 * Must be called by the source (msg.sender = source).
 */
export declare function recordCompletion(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: `0x${string}`, sink: `0x${string}`, taskId: `0x${string}`, sinkSignature: Hex): Promise<Hash>;
/**
 * Advance the completion epoch for a task type + sink, triggering slash if needed.
 */
export declare function advanceCompletionEpoch(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: `0x${string}`, sink: `0x${string}`): Promise<Hash>;
/**
 * Get the completion rate (BPS) for a task type + sink in the current epoch.
 */
export declare function getCompletionRate(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: `0x${string}`, sink: `0x${string}`): Promise<bigint>;
/**
 * Get completion count for a task type + sink in the current epoch.
 */
export declare function getCompletions(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: `0x${string}`, sink: `0x${string}`): Promise<bigint>;
