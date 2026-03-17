import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
// ──────────────────── Writes ────────────────────
export async function wrap(walletClient, addrs, amount) {
    return write(walletClient, {
        address: addrs.demurrageToken, abi: abis.DemurrageToken,
        functionName: "wrap", args: [amount],
    });
}
export async function unwrap(walletClient, addrs, amount) {
    return write(walletClient, {
        address: addrs.demurrageToken, abi: abis.DemurrageToken,
        functionName: "unwrap", args: [amount],
    });
}
export async function rebase(walletClient, addrs, account) {
    return write(walletClient, {
        address: addrs.demurrageToken, abi: abis.DemurrageToken,
        functionName: "rebase", args: [account],
    });
}
// ──────────────────── Reads ────────────────────
export async function realBalanceOf(publicClient, addrs, account) {
    return read(publicClient, {
        address: addrs.demurrageToken, abi: abis.DemurrageToken,
        functionName: "realBalanceOf", args: [account],
    });
}
export async function nominalBalanceOf(publicClient, addrs, account) {
    return read(publicClient, {
        address: addrs.demurrageToken, abi: abis.DemurrageToken,
        functionName: "nominalBalanceOf", args: [account],
    });
}
export async function decayRate(publicClient, addrs) {
    return read(publicClient, {
        address: addrs.demurrageToken, abi: abis.DemurrageToken,
        functionName: "decayRate",
    });
}
export async function totalDecayed(publicClient, addrs) {
    return read(publicClient, {
        address: addrs.demurrageToken, abi: abis.DemurrageToken,
        functionName: "totalDecayed",
    });
}
