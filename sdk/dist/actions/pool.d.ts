import { type PublicClient, type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
/**
 * Create a Superfluid GDA pool for a task type.
 */
export declare function createPool(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash): Promise<Hash>;
/**
 * Trigger a rebalance of pool member units based on current capacity signals.
 */
export declare function rebalance(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash): Promise<Hash>;
/**
 * Check if a rebalance is needed for a task type.
 */
export declare function needsRebalance(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: Hash): Promise<boolean>;
/**
 * Get the Superfluid pool address for a task type.
 */
export declare function getPoolAddress(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: Hash): Promise<`0x${string}`>;
/**
 * Get member units for a sink in a pool.
 */
export declare function getMemberUnits(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: Hash, sink: `0x${string}`): Promise<bigint>;
/**
 * Get task type info from the registry.
 */
export declare function getTaskType(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: Hash): Promise<{
    minStake: bigint;
    sinkCount: bigint;
    totalCapacity: bigint;
}>;
