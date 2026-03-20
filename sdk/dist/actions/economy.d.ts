import { type PublicClient, type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
/** Template enum matching the Solidity EconomyFactory.Template. */
export declare const Template: {
    readonly MARKETPLACE: 0;
    readonly COOPERATIVE: 1;
    readonly PIPELINE: 2;
    readonly GUILD: 3;
};
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
export declare function deployEconomy(walletClient: WalletClient, addrs: ChainAddresses, config: EconomyConfig): Promise<Hash>;
/**
 * Get the deployment record for an economy.
 */
export declare function getEconomy(publicClient: PublicClient, addrs: ChainAddresses, economyId: Hash): Promise<EconomyDeployment>;
/**
 * Get all economy IDs owned by an address.
 */
export declare function getEconomiesByOwner(publicClient: PublicClient, addrs: ChainAddresses, owner: `0x${string}`): Promise<Hash[]>;
/**
 * Get the total number of deployed economies.
 */
export declare function economyCount(publicClient: PublicClient, addrs: ChainAddresses): Promise<bigint>;
