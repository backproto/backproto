/**
 * EIP-712 signing helpers for BPE off-chain messages.
 *
 * Two message types:
 * 1. CapacityAttestation - signed by sinks, submitted via OffchainAggregator
 * 2. CompletionReceipt - dual-signed by sink + source, submitted via CompletionTracker
 */
import type { WalletClient, Hash, Hex } from "viem";
export interface CapacityAttestation {
    taskTypeId: Hash;
    sink: `0x${string}`;
    capacity: bigint;
    timestamp: bigint;
    nonce: bigint;
}
export interface SignedAttestation {
    taskTypeId: Hash;
    sink: `0x${string}`;
    capacity: bigint;
    timestamp: bigint;
    nonce: bigint;
    signature: Hex;
}
export interface CompletionReceipt {
    taskTypeId: Hash;
    sink: `0x${string}`;
    source: `0x${string}`;
    taskId: Hash;
    timestamp: bigint;
}
/**
 * Sign a capacity attestation as a sink. The signature is verified
 * on-chain by OffchainAggregator.submitBatch().
 */
export declare function signCapacityAttestation(walletClient: WalletClient, chainId: number, verifyingContract: `0x${string}`, attestation: CapacityAttestation): Promise<SignedAttestation>;
/**
 * Sign a completion receipt. Both sink and source must sign the same receipt.
 * The source calls CompletionTracker.recordCompletion() with both signatures.
 *
 * Note: The contract uses block.timestamp at submission time, but the signature
 * is over a timestamp provided by the signer. The contract reconstructs the
 * struct hash using block.timestamp, so both parties should sign with the
 * expected submission timestamp (or sign just before submitting).
 */
export declare function signCompletionReceipt(walletClient: WalletClient, chainId: number, verifyingContract: `0x${string}`, receipt: CompletionReceipt): Promise<Hex>;
