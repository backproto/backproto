import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
// ──────────────────── Reputation Reads ────────────────────
export async function getAggregateReputation(publicClient, addrs, account) {
    return read(publicClient, {
        address: addrs.reputationLedger, abi: abis.ReputationLedger,
        functionName: "getAggregateReputation", args: [account],
    });
}
export async function getStakeDiscount(publicClient, addrs, account, domain) {
    return read(publicClient, {
        address: addrs.reputationLedger, abi: abis.ReputationLedger,
        functionName: "getStakeDiscount", args: [account, domain],
    });
}
export async function getAccountDomains(publicClient, addrs, account) {
    return read(publicClient, {
        address: addrs.reputationLedger, abi: abis.ReputationLedger,
        functionName: "getAccountDomains", args: [account],
    });
}
// ──────────────────── Router ────────────────────
export async function isProtocolAvailable(publicClient, addrs, protocol) {
    return read(publicClient, {
        address: addrs.crossProtocolRouter, abi: abis.CrossProtocolRouter,
        functionName: "isProtocolAvailable", args: [protocol],
    });
}
// ──────────────────── Adapter ────────────────────
export async function normalizeCapacity(publicClient, addrs, domainId, rawSignal) {
    return read(publicClient, {
        address: addrs.universalCapacityAdapter, abi: abis.UniversalCapacityAdapter,
        functionName: "normalizeCapacity", args: [domainId, rawSignal],
    });
}
export async function routeAttestation(walletClient, addrs, domainId, attestation) {
    return write(walletClient, {
        address: addrs.universalCapacityAdapter, abi: abis.UniversalCapacityAdapter,
        functionName: "routeAttestation", args: [domainId, attestation],
    });
}
