import { abis } from "../abis/index.js";
import { write } from "../helpers.js";
export async function registerSink(walletClient, addrs, taskTypeId, initialCapacity) {
    return write(walletClient, {
        address: addrs.capacityRegistry, abi: abis.CapacityRegistry,
        functionName: "registerSink", args: [taskTypeId, initialCapacity],
    });
}
export async function deregisterSink(walletClient, addrs, taskTypeId) {
    return write(walletClient, {
        address: addrs.capacityRegistry, abi: abis.CapacityRegistry,
        functionName: "deregisterSink", args: [taskTypeId],
    });
}
