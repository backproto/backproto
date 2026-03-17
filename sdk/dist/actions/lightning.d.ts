import { type WalletClient, type PublicClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
export declare function registerNode(walletClient: WalletClient, addrs: ChainAddresses, nodePubkey: Hash, initialCapacitySats: bigint): Promise<Hash>;
export declare function deregisterNode(walletClient: WalletClient, addrs: ChainAddresses, nodePubkey: Hash): Promise<Hash>;
export declare function joinRoutingPool(walletClient: WalletClient, addrs: ChainAddresses, nodePubkey: Hash): Promise<Hash>;
export declare function leaveRoutingPool(walletClient: WalletClient, addrs: ChainAddresses, nodePubkey: Hash): Promise<Hash>;
export declare function rebalanceRoutingPool(walletClient: WalletClient, addrs: ChainAddresses): Promise<Hash>;
export declare function getSmoothedCapacity(publicClient: PublicClient, addrs: ChainAddresses, nodePubkey: Hash): Promise<bigint>;
export declare function getOptimalRoute(publicClient: PublicClient, addrs: ChainAddresses, amountSats: bigint, maxNodes: bigint): Promise<{
    nodePubkeys: Hash[];
    allocations: bigint[];
    fees: bigint[];
}>;
export declare function getRoutingFee(publicClient: PublicClient, addrs: ChainAddresses, nodePubkey: Hash): Promise<bigint>;
