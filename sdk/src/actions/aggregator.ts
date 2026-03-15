import { type WalletClient, type Hash, type Hex } from "viem";
import { abis } from "../abis/index.js";
import type { ChainAddresses } from "../addresses.js";
import type { SignedAttestation } from "../signing.js";
import { write } from "../helpers.js";

/**
 * Submit a batch of signed capacity attestations to the on-chain aggregator.
 */
export async function submitBatch(
  walletClient: WalletClient,
  addrs: ChainAddresses,
  attestations: SignedAttestation[],
): Promise<Hash> {
  const batch = attestations.map((a) => ({
    taskTypeId: a.taskTypeId,
    sink: a.sink,
    capacity: a.capacity,
    timestamp: a.timestamp,
    nonce: a.nonce,
    signature: a.signature as Hex,
  }));
  return write(walletClient, {
    address: addrs.offchainAggregator, abi: abis.OffchainAggregator,
    functionName: "submitBatch", args: [batch],
  });
}
