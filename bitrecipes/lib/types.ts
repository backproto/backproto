export type Domain = "ai" | "nostr" | "general" | "infrastructure" | "defi";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Provider {
  name: string;
  endpoint: string;
  capacityAttestor: string;
  stake: {
    manager: string;
    min: string;
  };
  pricingCurve: {
    base: number;
    k: number;
    alpha: number;
  };
}

export interface Step {
  id: string;
  kind: string;
  providers: Provider[];
}

export interface Recipe {
  slug: string;
  name: string;
  description: string;
  domain: Domain;
  difficulty: Difficulty;
  contracts_used: string[];
  funding?: {
    escrowBuffer: string;
    superfluid?: { enabled: boolean };
  };
  steps: Step[];
  routing?: {
    policy: string;
    fairness: string;
    minProviders: number;
    maxSharePerProvider: number;
  };
  settlement?: {
    backpressurePool: string;
    completionTracker: string;
    penalties?: {
      slo: Record<string, number>;
      misreportingMultiplier: number;
    };
  };
  observability?: {
    export: string[];
  };
}

export interface AtomicPattern {
  slug: string;
  name: string;
  description: string;
  contract: string;
  difficulty: Difficulty;
}

// Simulation types

export interface ProviderState {
  id: string;
  name: string;
  alive: boolean;
  capacity: number; // 0-1
  utilization: number; // 0-1
  earnings: number;
  requestsHandled: number;
  latencyMs: number;
  pricingCurve: { base: number; k: number; alpha: number };
}

export interface SimulationState {
  tick: number;
  providers: ProviderState[];
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  allocationEfficiency: number;
  sloCompliance: number;
  reroutes: number;
  gasCostEstimate: number;
}

export interface SimulationConfig {
  loadFactor: number; // 0-1
  tickIntervalMs: number;
}
