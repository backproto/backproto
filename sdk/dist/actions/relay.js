import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
// ──────────────────── Relay Registration ────────────────────
export async function registerRelay(walletClient, addrs, nostrPubkey, initialCapacity) {
    return write(walletClient, {
        address: addrs.relayCapacityRegistry, abi: abis.RelayCapacityRegistry,
        functionName: "registerRelay",
        args: [nostrPubkey, [initialCapacity.eventsPerSecond, initialCapacity.storageGB, initialCapacity.bandwidthMbps]],
    });
}
export async function deregisterRelay(walletClient, addrs, nostrPubkey) {
    return write(walletClient, {
        address: addrs.relayCapacityRegistry, abi: abis.RelayCapacityRegistry,
        functionName: "deregisterRelay", args: [nostrPubkey],
    });
}
// ──────────────────── Pool Management ────────────────────
export async function joinRelayPool(walletClient, addrs, poolType, // RELAY_WRITE = 0, RELAY_READ = 1, RELAY_STORE = 2
nostrPubkey) {
    return write(walletClient, {
        address: addrs.relayPaymentPool, abi: abis.RelayPaymentPool,
        functionName: "joinPool", args: [poolType, nostrPubkey],
    });
}
export async function setAntiSpamMinimum(walletClient, addrs, poolType, minPayment) {
    return write(walletClient, {
        address: addrs.relayPaymentPool, abi: abis.RelayPaymentPool,
        functionName: "setAntiSpamMinimum", args: [poolType, minPayment],
    });
}
// ──────────────────── Reads ────────────────────
export async function getRelayOperator(publicClient, addrs, nostrPubkey) {
    return read(publicClient, {
        address: addrs.relayCapacityRegistry, abi: abis.RelayCapacityRegistry,
        functionName: "getRelayOperator", args: [nostrPubkey],
    });
}
export async function getCompositeCapacity(publicClient, addrs, nostrPubkey) {
    return read(publicClient, {
        address: addrs.relayCapacityRegistry, abi: abis.RelayCapacityRegistry,
        functionName: "getCompositeCapacity", args: [nostrPubkey],
    });
}
export async function getAntiSpamMinimum(publicClient, addrs, poolType) {
    return read(publicClient, {
        address: addrs.relayPaymentPool, abi: abis.RelayPaymentPool,
        functionName: "getAntiSpamMinimum", args: [poolType],
    });
}
export async function getAllRelays(publicClient, addrs) {
    const [pubkeys, capacities] = await read(publicClient, {
        address: addrs.relayCapacityRegistry, abi: abis.RelayCapacityRegistry,
        functionName: "getAllRelays",
    });
    return { pubkeys, capacities };
}
