import { type PublicClient } from "viem";
import type { ChainAddresses } from "../addresses.js";
/**
 * Read current system temperature τ from the oracle.
 */
export declare function getTemperature(client: PublicClient, addrs: ChainAddresses): Promise<bigint>;
/**
 * Compute Boltzmann weight for a given capacity value.
 */
export declare function boltzmannWeight(client: PublicClient, addrs: ChainAddresses, capacity: bigint): Promise<bigint>;
/**
 * Read τ_min and τ_max bounds.
 */
export declare function getTauBounds(client: PublicClient, addrs: ChainAddresses): Promise<{
    tauMin: bigint;
    tauMax: bigint;
}>;
