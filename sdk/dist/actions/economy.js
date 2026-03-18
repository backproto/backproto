import { abis } from "../abis/index.js";
import { write, read } from "../helpers.js";
/** Template enum matching the Solidity EconomyFactory.Template. */
export const Template = {
    MARKETPLACE: 0,
    COOPERATIVE: 1,
    PIPELINE: 2,
    GUILD: 3,
};
/**
 * Deploy a complete BPE economy in a single transaction.
 */
export async function deployEconomy(walletClient, addrs, config) {
    return write(walletClient, {
        address: addrs.economyFactory, abi: abis.EconomyFactory,
        functionName: "deployEconomy",
        args: [config],
    });
}
/**
 * Get the deployment record for an economy.
 */
export async function getEconomy(publicClient, addrs, economyId) {
    return read(publicClient, {
        address: addrs.economyFactory, abi: abis.EconomyFactory,
        functionName: "getEconomy", args: [economyId],
    });
}
/**
 * Get all economy IDs owned by an address.
 */
export async function getEconomiesByOwner(publicClient, addrs, owner) {
    return read(publicClient, {
        address: addrs.economyFactory, abi: abis.EconomyFactory,
        functionName: "getEconomiesByOwner", args: [owner],
    });
}
/**
 * Get the total number of deployed economies.
 */
export async function economyCount(publicClient, addrs) {
    return read(publicClient, {
        address: addrs.economyFactory, abi: abis.EconomyFactory,
        functionName: "economyCount",
    });
}
