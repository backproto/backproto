import { type PublicClient } from "viem";
import type { ChainAddresses } from "../addresses.js";
/**
 * Read current virial ratio V from the monitor.
 */
export declare function getVirialRatio(client: PublicClient, addrs: ChainAddresses): Promise<bigint>;
/**
 * Read recommended demurrage rate from virial monitor.
 */
export declare function getRecommendedDemurrageRate(client: PublicClient, addrs: ChainAddresses): Promise<bigint>;
/**
 * Read recommended stake adjustment hint.
 */
export declare function getStakeAdjustment(client: PublicClient, addrs: ChainAddresses): Promise<bigint>;
/**
 * Read equilibrium target.
 */
export declare function getEquilibriumTarget(client: PublicClient, addrs: ChainAddresses): Promise<bigint>;
