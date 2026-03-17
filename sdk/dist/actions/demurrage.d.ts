import { type WalletClient, type PublicClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
export declare function wrap(walletClient: WalletClient, addrs: ChainAddresses, amount: bigint): Promise<Hash>;
export declare function unwrap(walletClient: WalletClient, addrs: ChainAddresses, amount: bigint): Promise<Hash>;
export declare function rebase(walletClient: WalletClient, addrs: ChainAddresses, account: `0x${string}`): Promise<Hash>;
export declare function realBalanceOf(publicClient: PublicClient, addrs: ChainAddresses, account: `0x${string}`): Promise<bigint>;
export declare function nominalBalanceOf(publicClient: PublicClient, addrs: ChainAddresses, account: `0x${string}`): Promise<bigint>;
export declare function decayRate(publicClient: PublicClient, addrs: ChainAddresses): Promise<bigint>;
export declare function totalDecayed(publicClient: PublicClient, addrs: ChainAddresses): Promise<bigint>;
