// ─── EIP-712 Domain Constants ───
const ATTESTATION_DOMAIN = {
    name: "BPE-OffchainAggregator",
    version: "1",
};
const COMPLETION_DOMAIN = {
    name: "BPE-CompletionTracker",
    version: "1",
};
// ─── EIP-712 Type Definitions ───
const ATTESTATION_TYPES = {
    CapacityAttestation: [
        { name: "taskTypeId", type: "bytes32" },
        { name: "sink", type: "address" },
        { name: "capacity", type: "uint256" },
        { name: "timestamp", type: "uint256" },
        { name: "nonce", type: "uint256" },
    ],
};
const COMPLETION_TYPES = {
    CompletionReceipt: [
        { name: "taskTypeId", type: "bytes32" },
        { name: "sink", type: "address" },
        { name: "source", type: "address" },
        { name: "taskId", type: "bytes32" },
        { name: "timestamp", type: "uint256" },
    ],
};
// ─── Signing Functions ───
/**
 * Sign a capacity attestation as a sink. The signature is verified
 * on-chain by OffchainAggregator.submitBatch().
 */
export async function signCapacityAttestation(walletClient, chainId, verifyingContract, attestation) {
    const signature = await walletClient.signTypedData({
        account: walletClient.account,
        domain: {
            ...ATTESTATION_DOMAIN,
            chainId,
            verifyingContract,
        },
        types: ATTESTATION_TYPES,
        primaryType: "CapacityAttestation",
        message: {
            taskTypeId: attestation.taskTypeId,
            sink: attestation.sink,
            capacity: attestation.capacity,
            timestamp: attestation.timestamp,
            nonce: attestation.nonce,
        },
    });
    return {
        ...attestation,
        signature,
    };
}
/**
 * Sign a completion receipt. Both sink and source must sign the same receipt.
 * The source calls CompletionTracker.recordCompletion() with both signatures.
 *
 * Note: The contract uses block.timestamp at submission time, but the signature
 * is over a timestamp provided by the signer. The contract reconstructs the
 * struct hash using block.timestamp, so both parties should sign with the
 * expected submission timestamp (or sign just before submitting).
 */
export async function signCompletionReceipt(walletClient, chainId, verifyingContract, receipt) {
    return walletClient.signTypedData({
        account: walletClient.account,
        domain: {
            ...COMPLETION_DOMAIN,
            chainId,
            verifyingContract,
        },
        types: COMPLETION_TYPES,
        primaryType: "CompletionReceipt",
        message: {
            taskTypeId: receipt.taskTypeId,
            sink: receipt.sink,
            source: receipt.source,
            taskId: receipt.taskId,
            timestamp: receipt.timestamp,
        },
    });
}
