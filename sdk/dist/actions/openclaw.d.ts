import { type WalletClient, type PublicClient, type Hash } from "viem";
import type { ChainAddresses } from "../addresses.js";
export declare function registerAgent(walletClient: WalletClient, addrs: ChainAddresses, agentId: Hash, skillTypeId: Hash, initialCapacity: {
    throughput: bigint;
    latencyMs: bigint;
    errorRateBps: bigint;
}): Promise<Hash>;
export declare function deregisterAgent(walletClient: WalletClient, addrs: ChainAddresses, agentId: Hash): Promise<Hash>;
export declare function updateCapacity(walletClient: WalletClient, addrs: ChainAddresses, agentId: Hash, capacity: {
    throughput: bigint;
    latencyMs: bigint;
    errorRateBps: bigint;
}): Promise<Hash>;
export declare function verifyExecution(walletClient: WalletClient, addrs: ChainAddresses, agentId: Hash, skillTypeId: Hash, executionId: Hash, agentOperator: `0x${string}`, agentSig: `0x${string}`, requesterSig: `0x${string}`): Promise<Hash>;
export declare function reportCompletion(walletClient: WalletClient, addrs: ChainAddresses, operator: `0x${string}`, skillTypeId: Hash): Promise<Hash>;
export declare function reportFailure(walletClient: WalletClient, addrs: ChainAddresses, operator: `0x${string}`, skillTypeId: Hash): Promise<Hash>;
export declare function getAgent(publicClient: PublicClient, addrs: ChainAddresses, agentId: Hash): Promise<{
    operator: `0x${string}`;
    skillTypeId: Hash;
    smoothedCapacity: bigint;
    lastUpdated: bigint;
    active: boolean;
}>;
export declare function getSmoothedCapacity(publicClient: PublicClient, addrs: ChainAddresses, agentId: Hash): Promise<bigint>;
export declare function getAgentsForSkill(publicClient: PublicClient, addrs: ChainAddresses, skillTypeId: Hash): Promise<Hash[]>;
export declare function getOpenClawReputation(publicClient: PublicClient, addrs: ChainAddresses, operator: `0x${string}`): Promise<{
    score: bigint;
    stakeDuration: bigint;
    completions: bigint;
    slashCount: bigint;
    lastUpdated: bigint;
}>;
export declare function getOpenClawStakeDiscount(publicClient: PublicClient, addrs: ChainAddresses, operator: `0x${string}`): Promise<bigint>;
export declare function isExecutionRecorded(publicClient: PublicClient, addrs: ChainAddresses, executionId: Hash): Promise<boolean>;
