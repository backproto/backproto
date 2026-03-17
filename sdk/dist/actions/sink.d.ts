import { type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
export declare function registerSink(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash, initialCapacity: bigint): Promise<Hash>;
export declare function deregisterSink(walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash): Promise<Hash>;
