import { type WalletClient, type PublicClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
export declare function getAggregateReputation(publicClient: PublicClient, addrs: ChainAddresses, account: `0x${string}`): Promise<bigint>;
export declare function getStakeDiscount(publicClient: PublicClient, addrs: ChainAddresses, account: `0x${string}`, domain: Hash): Promise<bigint>;
export declare function getAccountDomains(publicClient: PublicClient, addrs: ChainAddresses, account: `0x${string}`): Promise<Hash[]>;
export declare function isProtocolAvailable(publicClient: PublicClient, addrs: ChainAddresses, protocol: 0 | 1 | 2): Promise<boolean>;
export declare function normalizeCapacity(publicClient: PublicClient, addrs: ChainAddresses, domainId: Hash, rawSignal: `0x${string}`): Promise<bigint>;
export declare function routeAttestation(walletClient: WalletClient, addrs: ChainAddresses, domainId: Hash, attestation: `0x${string}`): Promise<Hash>;
