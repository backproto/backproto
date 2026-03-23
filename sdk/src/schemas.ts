/**
 * Standard protocol object types for the five canonical data structures.
 * These types correspond to the JSON schemas in sdk/schemas/*.schema.json.
 *
 * Where possible, these extend or alias the existing types in signing.ts
 * to maintain backward compatibility.
 */
import type { Hash, Hex } from "viem";

// Re-export existing types that overlap with schemas
export type { CapacityAttestation, SignedAttestation, CompletionReceipt } from "./signing.js";

// ─── Settlement Rails ───

export type SettlementRail = "SUPERFLUID" | "LIGHTNING" | "DIRECT";

// ─── JobIntent ───

export interface JobIntent {
  id: Hash;
  source: `0x${string}`;
  kind: number;
  input: string;
  maxBudget: bigint;
  timestamp: number;
  preferredSinks?: `0x${string}`[];
  settlementRail?: SettlementRail;
  nostrEventId?: string;
}

// ─── VerificationReceipt ───

export interface VerificationReceipt {
  taskTypeId: Hash;
  sink: `0x${string}`;
  source: `0x${string}`;
  taskId: Hash;
  timestamp: bigint;
  sinkSignature: Hex;
  sourceSignature: Hex;
  evidenceHash?: Hash;
  nostrEventId?: string;
}

// ─── PriceSignal ───

export interface PriceSignal {
  taskTypeId: Hash;
  sink: `0x${string}`;
  price: bigint;
  baseFee: bigint;
  timestamp: number;
  queueLoad?: bigint;
  capacity?: bigint;
  utilizationBps?: number;
  escrowPressure?: bigint;
  kindWeight?: number;
}

// ─── SettlementReceipt ───

export interface SettlementReceipt {
  jobId: Hash;
  provider: `0x${string}`;
  amount: bigint;
  rail: SettlementRail;
  timestamp: number;
  txHash?: Hash;
  streamId?: Hash;
  preimage?: Hex;
  chainId?: number;
}

// ─── Raw capacity metrics (pre-normalization) ───

export interface RawCapacityMetrics {
  throughput: number;
  latencyMs: number;
  errorRateBps: number;
}

// ─── Extended CapacityAttestation with raw metrics ───

export interface CapacityAttestationWithMetrics {
  taskTypeId: Hash;
  sink: `0x${string}`;
  capacity: bigint;
  timestamp: bigint;
  nonce: bigint;
  signature: Hex;
  domain?: string;
  rawMetrics?: RawCapacityMetrics;
}
