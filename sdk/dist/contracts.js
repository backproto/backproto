import { getContract } from "viem";
import { abis } from "./abis/index.js";
export function getContracts(addrs, publicClient, walletClient) {
    return {
        stakeManager: getContract({
            address: addrs.stakeManager,
            abi: abis.StakeManager,
            client: { public: publicClient, wallet: walletClient },
        }),
        capacityRegistry: getContract({
            address: addrs.capacityRegistry,
            abi: abis.CapacityRegistry,
            client: { public: publicClient, wallet: walletClient },
        }),
        backpressurePool: getContract({
            address: addrs.backpressurePool,
            abi: abis.BackpressurePool,
            client: { public: publicClient, wallet: walletClient },
        }),
        escrowBuffer: getContract({
            address: addrs.escrowBuffer,
            abi: abis.EscrowBuffer,
            client: { public: publicClient, wallet: walletClient },
        }),
        pipeline: getContract({
            address: addrs.pipeline,
            abi: abis.Pipeline,
            client: { public: publicClient, wallet: walletClient },
        }),
        gdaV1Forwarder: getContract({
            address: addrs.gdaV1Forwarder,
            abi: abis.GDAv1Forwarder,
            client: { public: publicClient, wallet: walletClient },
        }),
        pricingCurve: getContract({
            address: addrs.pricingCurve,
            abi: abis.PricingCurve,
            client: { public: publicClient, wallet: walletClient },
        }),
        completionTracker: getContract({
            address: addrs.completionTracker,
            abi: abis.CompletionTracker,
            client: { public: publicClient, wallet: walletClient },
        }),
        offchainAggregator: getContract({
            address: addrs.offchainAggregator,
            abi: abis.OffchainAggregator,
            client: { public: publicClient, wallet: walletClient },
        }),
    };
}
