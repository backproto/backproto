import { type PublicClient, type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
/**
 * Register a child pool under a parent task type in the hierarchy.
 */
export declare function registerChild(walletClient: WalletClient, addrs: ChainAddresses, parentTaskTypeId: Hash, childTaskTypeId: Hash): Promise<Hash>;
/**
 * Deregister a child pool from a parent task type.
 */
export declare function deregisterChild(walletClient: WalletClient, addrs: ChainAddresses, parentTaskTypeId: Hash, childTaskTypeId: Hash): Promise<Hash>;
/**
 * Trigger a bottom-up hierarchical rebalance starting from a task type.
 */
export declare function rebalanceHierarchy(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash, maxDepth: bigint): Promise<Hash>;
/**
 * Check if a task type is a child of another.
 */
export declare function isChildPool(publicClient: PublicClient, addrs: ChainAddresses, parentTaskTypeId: Hash, childTaskTypeId: Hash): Promise<boolean>;
/**
 * Get the effective capacity of a task type (includes child pool capacity).
 */
export declare function getEffectiveCapacity(publicClient: PublicClient, addrs: ChainAddresses, taskTypeId: Hash): Promise<bigint>;
/**
 * Get all child task type IDs for a parent.
 */
export declare function getChildren(publicClient: PublicClient, addrs: ChainAddresses, parentTaskTypeId: Hash): Promise<Hash[]>;
