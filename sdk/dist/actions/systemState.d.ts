import { type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
/**
 * Emit an aggregated system state snapshot for a given scope.
 */
export declare function emitState(walletClient: WalletClient, addrs: ChainAddresses, scope: Hash): Promise<Hash>;
