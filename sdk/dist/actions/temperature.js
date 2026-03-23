import { abis } from "../abis/index.js";
import { read } from "../helpers.js";
/**
 * Read current system temperature τ from the oracle.
 */
export async function getTemperature(client, addrs) {
    return read(client, {
        address: addrs.temperatureOracle, abi: abis.TemperatureOracle,
        functionName: "getTemperature",
    });
}
/**
 * Compute Boltzmann weight for a given capacity value.
 */
export async function boltzmannWeight(client, addrs, capacity) {
    return read(client, {
        address: addrs.temperatureOracle, abi: abis.TemperatureOracle,
        functionName: "boltzmannWeight", args: [capacity],
    });
}
/**
 * Read τ_min and τ_max bounds.
 */
export async function getTauBounds(client, addrs) {
    const [tauMin, tauMax] = await Promise.all([
        read(client, {
            address: addrs.temperatureOracle, abi: abis.TemperatureOracle,
            functionName: "tauMin",
        }),
        read(client, {
            address: addrs.temperatureOracle, abi: abis.TemperatureOracle,
            functionName: "tauMax",
        }),
    ]);
    return { tauMin, tauMax };
}
