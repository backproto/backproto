import { type PublicClient, type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
/**
 * Wrap underlying tokens into VelocityTokens.
 */
export declare function wrap(walletClient: WalletClient, addrs: ChainAddresses, amount: bigint): Promise<Hash>;
/**
 * Unwrap VelocityTokens back to underlying (at current decayed value).
 */
export declare function unwrap(walletClient: WalletClient, addrs: ChainAddresses, amount: bigint): Promise<Hash>;
/**
 * Force-apply idle decay to an account.
 */
export declare function applyIdleDecay(walletClient: WalletClient, addrs: ChainAddresses, account: `0x${string}`): Promise<Hash>;
/**
 * Get the real balance after idle decay.
 */
export declare function realBalanceOf(publicClient: PublicClient, addrs: ChainAddresses, account: `0x${string}`): Promise<bigint>;
/**
 * Get seconds the balance has been idle.
 */
export declare function idleDuration(publicClient: PublicClient, addrs: ChainAddresses, account: `0x${string}`): Promise<bigint>;
/**
 * Check if an account is stream-exempt from decay.
 */
export declare function isStreamExempt(publicClient: PublicClient, addrs: ChainAddresses, account: `0x${string}`): Promise<boolean>;
