import { type WalletClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
import type { SignedAttestation } from "../signing.js";
/**
 * Submit a batch of signed capacity attestations to the on-chain aggregator.
 */
export declare function submitBatch(walletClient: WalletClient, addrs: ChainAddresses, attestations: SignedAttestation[]): Promise<Hash>;
