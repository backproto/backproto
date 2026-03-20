"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Recipe, SimulationState } from "@/lib/types";
import { createSimulation } from "@/lib/simulation";
import { PipelineRenderer } from "@/components/PipelineRenderer";
import { SimulationPanel } from "@/components/SimulationPanel";
import { YamlViewer } from "@/components/YamlViewer";

interface Props {
  recipe: Recipe;
  rawYaml: string;
}

export function RecipeDetailClient({ recipe, rawYaml }: Props) {
  const simRef = useRef<ReturnType<typeof createSimulation> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<SimulationState | null>(null);
  const [running, setRunning] = useState(false);
  const [loadFactor, setLoadFactor] = useState(0.3);

  const initSim = useCallback(() => {
    const sim = createSimulation(recipe, {
      loadFactor,
      tickIntervalMs: 400,
    });
    simRef.current = sim;
    setState(sim.getState());
  }, [recipe, loadFactor]);

  useEffect(() => {
    initSim();
  }, [initSim]);

  useEffect(() => {
    if (running && simRef.current) {
      intervalRef.current = setInterval(() => {
        if (simRef.current) {
          setState(simRef.current.tick());
        }
      }, 400);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function handleToggle() {
    setRunning((r) => !r);
  }

  function handleReset() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    initSim();
  }

  function handleKill(id: string) {
    simRef.current?.killProvider(id);
  }

  function handleRevive(id: string) {
    simRef.current?.reviveProvider(id);
  }

  function handleDegrade(id: string) {
    simRef.current?.degradeProvider(id, 0.5);
  }

  function handleSpike() {
    setLoadFactor((lf) => Math.min(1.0, lf * 3));
  }

  if (!state) return null;

  return (
    <div className="space-y-8">
      <PipelineRenderer recipe={recipe} providerStates={state.providers} />
      <SimulationPanel
        state={state}
        loadFactor={loadFactor}
        onLoadChange={setLoadFactor}
        onKillProvider={handleKill}
        onReviveProvider={handleRevive}
        onDegradeProvider={handleDegrade}
        onSpikeLoad={handleSpike}
        running={running}
        onToggle={handleToggle}
        onReset={handleReset}
      />
      <YamlViewer yaml={rawYaml} />
    </div>
  );
}
