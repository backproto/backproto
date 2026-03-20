"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PipelineRenderer } from "@/components/PipelineRenderer";
import { createSimulation } from "@/lib/simulation";
import type { Recipe, SimulationState } from "@/lib/types";

// Inline the flagship recipe so the hero can render client-side without a fetch
const heroRecipe: Recipe = {
  slug: "llm-ensemble-router",
  name: "LLM Ensemble (capacity-weighted)",
  description:
    "Route completions across multiple model runners; weights follow spare capacity and price.",
  domain: "ai",
  difficulty: "intermediate",
  contracts_used: [
    "CapacityRegistry",
    "BackpressurePool",
    "PricingCurve",
    "EscrowBuffer",
    "CompletionTracker",
    "StakeManager",
  ],
  steps: [
    {
      id: "prompt-to-tokens",
      kind: "openai-compatible",
      providers: [
        {
          name: "vLLM-A",
          endpoint: "",
          capacityAttestor: "",
          stake: { manager: "", min: "500 USDC" },
          pricingCurve: { base: 0.0008, k: 0.15, alpha: 2.0 },
        },
        {
          name: "vLLM-B",
          endpoint: "",
          capacityAttestor: "",
          stake: { manager: "", min: "500 USDC" },
          pricingCurve: { base: 0.0007, k: 0.2, alpha: 1.8 },
        },
        {
          name: "CloudAPI-C",
          endpoint: "",
          capacityAttestor: "",
          stake: { manager: "", min: "500 USDC" },
          pricingCurve: { base: 0.0012, k: 0.1, alpha: 2.5 },
        },
      ],
    },
  ],
  routing: {
    policy: "capacity_weighted",
    fairness: "lyapunov_optimal",
    minProviders: 2,
    maxSharePerProvider: 0.7,
  },
  settlement: {
    backpressurePool: "",
    completionTracker: "",
    penalties: {
      slo: { p95_latency_ms: 1500, timeout_ms: 8000 },
      misreportingMultiplier: 3.0,
    },
  },
};

export function HeroSimulation() {
  const simRef = useRef<ReturnType<typeof createSimulation> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<SimulationState | null>(null);

  const startSim = useCallback(() => {
    const sim = createSimulation(heroRecipe, {
      loadFactor: 0.4,
      tickIntervalMs: 500,
    });
    simRef.current = sim;

    // Initial tick
    setState(sim.tick());

    intervalRef.current = setInterval(() => {
      setState(sim.tick());
    }, 500);
  }, []);

  useEffect(() => {
    startSim();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startSim]);

  return (
    <div className="relative">
      <PipelineRenderer
        recipe={heroRecipe}
        providerStates={state?.providers}
      />
      {state && (
        <div className="mt-4 flex gap-6 text-xs font-mono text-[var(--color-text-muted)]">
          <span>
            efficiency:{" "}
            <span className="text-[var(--color-green)]">
              {(state.allocationEfficiency * 100).toFixed(0)}%
            </span>
          </span>
          <span>
            requests:{" "}
            <span className="text-[var(--color-text)]">
              {state.totalRequests}
            </span>
          </span>
          <span>
            reroutes:{" "}
            <span className="text-[var(--color-yellow)]">
              {state.reroutes}
            </span>
          </span>
          <span>
            tick:{" "}
            <span className="text-[var(--color-text)]">{state.tick}</span>
          </span>
        </div>
      )}
    </div>
  );
}
