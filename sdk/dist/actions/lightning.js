import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
// ──────────────────── Node Management ────────────────────
export async function registerNode(walletClient, addrs, nodePubkey, initialCapacitySats) {
    return write(walletClient, {
        address: addrs.lightningCapacityOracle, abi: abis.LightningCapacityOracle,
        functionName: "registerNode", args: [nodePubkey, initialCapacitySats],
    });
}
export async function deregisterNode(walletClient, addrs, nodePubkey) {
    return write(walletClient, {
        address: addrs.lightningCapacityOracle, abi: abis.LightningCapacityOracle,
        functionName: "deregisterNode", args: [nodePubkey],
    });
}
// ──────────────────── Pool ────────────────────
export async function joinRoutingPool(walletClient, addrs, nodePubkey) {
    return write(walletClient, {
        address: addrs.lightningRoutingPool, abi: abis.LightningRoutingPool,
        functionName: "joinPool", args: [nodePubkey],
    });
}
export async function leaveRoutingPool(walletClient, addrs, nodePubkey) {
    return write(walletClient, {
        address: addrs.lightningRoutingPool, abi: abis.LightningRoutingPool,
        functionName: "leavePool", args: [nodePubkey],
    });
}
export async function rebalanceRoutingPool(walletClient, addrs) {
    return write(walletClient, {
        address: addrs.lightningRoutingPool, abi: abis.LightningRoutingPool,
        functionName: "rebalance",
    });
}
// ──────────────────── Reads ────────────────────
export async function getSmoothedCapacity(publicClient, addrs, nodePubkey) {
    return read(publicClient, {
        address: addrs.lightningCapacityOracle, abi: abis.LightningCapacityOracle,
        functionName: "getSmoothedCapacity", args: [nodePubkey],
    });
}
export async function getOptimalRoute(publicClient, addrs, amountSats, maxNodes) {
    return read(publicClient, {
        address: addrs.lightningRoutingPool, abi: abis.LightningRoutingPool,
        functionName: "getOptimalRoute", args: [amountSats, maxNodes],
    });
}
export async function getRoutingFee(publicClient, addrs, nodePubkey) {
    return read(publicClient, {
        address: addrs.lightningRoutingPool, abi: abis.LightningRoutingPool,
        functionName: "getRoutingFee", args: [nodePubkey],
    });
}
export async function getAllNodes(publicClient, addrs) {
    const [pubkeys, capacities] = await read(publicClient, {
        address: addrs.lightningCapacityOracle, abi: abis.LightningCapacityOracle,
        functionName: "getAllNodes",
    });
    return { pubkeys, capacities };
}
