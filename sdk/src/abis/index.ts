import type { Abi } from "viem";
import BackpressurePoolAbi from "./BackpressurePool.json";
import CapacityRegistryAbi from "./CapacityRegistry.json";
import StakeManagerAbi from "./StakeManager.json";
import EscrowBufferAbi from "./EscrowBuffer.json";
import PipelineAbi from "./Pipeline.json";
import GDAv1ForwarderAbi from "./GDAv1Forwarder.json";
import PricingCurveAbi from "./PricingCurve.json";
import CompletionTrackerAbi from "./CompletionTracker.json";
import OffchainAggregatorAbi from "./OffchainAggregator.json";

export const abis = {
  BackpressurePool: BackpressurePoolAbi as unknown as Abi,
  CapacityRegistry: CapacityRegistryAbi as unknown as Abi,
  StakeManager: StakeManagerAbi as unknown as Abi,
  EscrowBuffer: EscrowBufferAbi as unknown as Abi,
  Pipeline: PipelineAbi as unknown as Abi,
  GDAv1Forwarder: GDAv1ForwarderAbi as unknown as Abi,
  PricingCurve: PricingCurveAbi as unknown as Abi,
  CompletionTracker: CompletionTrackerAbi as unknown as Abi,
  OffchainAggregator: OffchainAggregatorAbi as unknown as Abi,
} as const;

