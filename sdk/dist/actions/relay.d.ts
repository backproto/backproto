import { type WalletClient, type PublicClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
export declare function registerRelay(walletClient: WalletClient, addrs: ChainAddresses, nostrPubkey: Hash, initialCapacity: {
    eventsPerSecond: bigint;
    storageGB: bigint;
    bandwidthMbps: bigint;
}): Promise<Hash>;
export declare function deregisterRelay(walletClient: WalletClient, addrs: ChainAddresses, nostrPubkey: Hash): Promise<Hash>;
export declare function joinRelayPool(walletClient: WalletClient, addrs: ChainAddresses, poolType: 0 | 1 | 2, // RELAY_WRITE = 0, RELAY_READ = 1, RELAY_STORE = 2
nostrPubkey: Hash): Promise<Hash>;
export declare function setAntiSpamMinimum(walletClient: WalletClient, addrs: ChainAddresses, poolType: 0 | 1 | 2, minPayment: bigint): Promise<Hash>;
export declare function getRelayOperator(publicClient: PublicClient, addrs: ChainAddresses, nostrPubkey: Hash): Promise<`0x${string}`>;
export declare function getCompositeCapacity(publicClient: PublicClient, addrs: ChainAddresses, nostrPubkey: Hash): Promise<bigint>;
export declare function getAntiSpamMinimum(publicClient: PublicClient, addrs: ChainAddresses, poolType: 0 | 1 | 2): Promise<bigint>;
export declare function getAllRelays(publicClient: PublicClient, addrs: ChainAddresses): Promise<{
    pubkeys: Hash[];
    capacities: bigint[];
}>;
