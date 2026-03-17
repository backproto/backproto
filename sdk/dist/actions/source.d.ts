import { type PublicClient, type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
/**
 * Register a new task type in the CapacityRegistry.
 */
export declare function registerTaskType(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash, minStake: bigint): Promise<Hash>;
/**
 * Start a GDA distribution flow to a task type's pool.
 * The caller must have wrapped SuperTokens (tUSDCx) to fund the flow.
 */
export declare function startStream(walletClient: WalletClient, addrs: ChainAddresses, poolAddress: `0x${string}`, flowRate: bigint): Promise<Hash>;
/**
 * Stop a GDA distribution flow (set flow rate to 0).
 */
export declare function stopStream(walletClient: WalletClient, addrs: ChainAddresses, poolAddress: `0x${string}`): Promise<Hash>;
/**
 * Get the current flow rate from a distributor to a pool.
 */
export declare function getFlowRate(publicClient: PublicClient, addrs: ChainAddresses, from: `0x${string}`, poolAddress: `0x${string}`): Promise<bigint>;
/**
 * Get net flow for an account (sum of all inflows and outflows).
 */
export declare function getNetFlow(publicClient: PublicClient, addrs: ChainAddresses, account: `0x${string}`): Promise<bigint>;
