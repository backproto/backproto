import { abis } from "../abis/index.js";
import { write } from "../helpers.js";
/**
 * Submit a batch of signed capacity attestations to the on-chain aggregator.
 */
export async function submitBatch(walletClient, addrs, attestations) {
    const batch = attestations.map((a) => ({
        taskTypeId: a.taskTypeId,
        sink: a.sink,
        capacity: a.capacity,
        timestamp: a.timestamp,
        nonce: a.nonce,
        signature: a.signature,
    }));
    return write(walletClient, {
        address: addrs.offchainAggregator, abi: abis.OffchainAggregator,
        functionName: "submitBatch", args: [batch],
    });
}
