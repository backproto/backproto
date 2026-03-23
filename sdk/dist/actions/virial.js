import { abis } from "../abis/index.js";
import { read } from "../helpers.js";
/**
 * Read current virial ratio V from the monitor.
 */
export async function getVirialRatio(client, addrs) {
    return read(client, {
        address: addrs.virialMonitor, abi: abis.VirialMonitor,
        functionName: "getVirialRatio",
    });
}
/**
 * Read recommended demurrage rate from virial monitor.
 */
export async function getRecommendedDemurrageRate(client, addrs) {
    return read(client, {
        address: addrs.virialMonitor, abi: abis.VirialMonitor,
        functionName: "recommendedDemurrageRate",
    });
}
/**
 * Read recommended stake adjustment hint.
 */
export async function getStakeAdjustment(client, addrs) {
    return read(client, {
        address: addrs.virialMonitor, abi: abis.VirialMonitor,
        functionName: "recommendedStakeAdjustment",
    });
}
/**
 * Read equilibrium target.
 */
export async function getEquilibriumTarget(client, addrs) {
    return read(client, {
        address: addrs.virialMonitor, abi: abis.VirialMonitor,
        functionName: "equilibriumTarget",
    });
}
