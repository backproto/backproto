import { type PublicClient, type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
export type Deposit = {
    owner: `0x${string}`;
    amount: bigint;
    expiry: bigint;
    consumed: boolean;
};
/**
 * Mint urgency tokens with a TTL. Underlying tokens are locked.
 */
export declare function mint(walletClient: WalletClient, addrs: ChainAddresses, amount: bigint, ttlSeconds: bigint): Promise<Hash>;
/**
 * Consume an urgency deposit by routing it to a sink (authorized consumers only).
 */
export declare function consume(walletClient: WalletClient, addrs: ChainAddresses, depositId: bigint, sink: `0x${string}`): Promise<Hash>;
/**
 * Burn an expired deposit.
 */
export declare function burn(walletClient: WalletClient, addrs: ChainAddresses, depositId: bigint): Promise<Hash>;
/**
 * Batch-burn expired deposits.
 */
export declare function batchBurn(walletClient: WalletClient, addrs: ChainAddresses, depositIds: bigint[]): Promise<Hash>;
/**
 * Get deposit details.
 */
export declare function getDeposit(publicClient: PublicClient, addrs: ChainAddresses, depositId: bigint): Promise<Deposit>;
/**
 * Check if a deposit has expired.
 */
export declare function isExpired(publicClient: PublicClient, addrs: ChainAddresses, depositId: bigint): Promise<boolean>;
/**
 * Get remaining TTL in seconds (0 if expired).
 */
export declare function remainingTTL(publicClient: PublicClient, addrs: ChainAddresses, depositId: bigint): Promise<bigint>;
/**
 * Get total active urgency deposits.
 */
export declare function totalActive(publicClient: PublicClient, addrs: ChainAddresses): Promise<bigint>;
/**
 * Get total burned urgency deposits.
 */
export declare function totalBurned(publicClient: PublicClient, addrs: ChainAddresses): Promise<bigint>;
