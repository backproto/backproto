import {
  type WalletClient,
  type Hash,
} from "viem";
import { abis } from "../abis/index.js";
import type { ChainAddresses } from "../addresses.js";
import { write } from "../helpers.js";

export async function registerSink(
  walletClient: WalletClient, addrs: ChainAddresses,
  taskTypeId: Hash, initialCapacity: bigint,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.capacityRegistry, abi: abis.CapacityRegistry,
    functionName: "registerSink", args: [taskTypeId, initialCapacity],
  });
}

export async function deregisterSink(
  walletClient: WalletClient, addrs: ChainAddresses, taskTypeId: Hash,
): Promise<Hash> {
  return write(walletClient, {
    address: addrs.capacityRegistry, abi: abis.CapacityRegistry,
    functionName: "deregisterSink", args: [taskTypeId],
  });
}
