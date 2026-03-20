"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Recipe, ProviderState } from "@/lib/types";

function utilizationColor(u: number): string {
  if (u < 0.4) return "#22c55e";
  if (u < 0.7) return "#eab308";
  return "#ef4444";
}

interface Props {
  recipe: Recipe;
  providerStates?: ProviderState[];
}

export function PipelineRenderer({ recipe, providerStates }: Props) {
  const stateMap = useMemo(() => {
    const map: Record<string, ProviderState> = {};
    if (providerStates) {
      for (const ps of providerStates) {
        map[ps.id] = ps;
      }
    }
    return map;
  }, [providerStates]);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Entry node
    nodes.push({
      id: "entry",
      position: { x: 0, y: 150 },
      data: { label: "Requests" },
      sourcePosition: Position.Right,
      style: {
        background: "#1a1a1a",
        border: "1px solid #d97706",
        color: "#e5e5e5",
        borderRadius: "8px",
        padding: "12px 20px",
        fontSize: "13px",
        fontFamily: "var(--font-mono)",
      },
    });

    let stepX = 250;
    let prevStepId = "entry";

    for (const step of recipe.steps) {
      const stepId = `step-${step.id}`;

      // Step group label
      nodes.push({
        id: stepId,
        position: { x: stepX, y: 0 },
        data: { label: step.id },
        style: {
          background: "transparent",
          border: "1px dashed #262626",
          color: "#737373",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          width: "200px",
          height: `${step.providers.length * 80 + 40}px`,
        },
      });

      // Provider nodes within the step
      step.providers.forEach((provider, pIdx) => {
        const providerId = `${step.id}/${provider.name}`;
        const ps = stateMap[providerId];
        const util = ps?.utilization ?? 0;
        const alive = ps?.alive ?? true;

        nodes.push({
          id: providerId,
          position: { x: stepX + 20, y: 40 + pIdx * 80 },
          data: {
            label: `${provider.name}${ps ? ` ${Math.round(util * 100)}%` : ""}`,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          style: {
            background: alive ? "#141414" : "#1a0505",
            border: `1px solid ${alive ? utilizationColor(util) : "#4a0000"}`,
            color: alive ? "#e5e5e5" : "#666",
            borderRadius: "6px",
            padding: "8px 14px",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            opacity: alive ? 1 : 0.5,
          },
        });

        // Edge from previous step to each provider
        edges.push({
          id: `e-${prevStepId}-${providerId}`,
          source: prevStepId === "entry" ? "entry" : prevStepId,
          target: providerId,
          animated: alive,
          style: {
            stroke: alive ? utilizationColor(util) : "#333",
            strokeWidth: alive ? 1 + util * 2 : 1,
          },
        });
      });

      prevStepId = step.providers[0]
        ? `${step.id}/${step.providers[0].name}`
        : stepId;
      stepX += 280;
    }

    // Exit node
    nodes.push({
      id: "exit",
      position: { x: stepX, y: 150 },
      data: { label: "Settlement" },
      targetPosition: Position.Left,
      style: {
        background: "#1a1a1a",
        border: "1px solid #d97706",
        color: "#e5e5e5",
        borderRadius: "8px",
        padding: "12px 20px",
        fontSize: "13px",
        fontFamily: "var(--font-mono)",
      },
    });

    // Connect last step providers to exit
    const lastStep = recipe.steps[recipe.steps.length - 1];
    if (lastStep) {
      for (const p of lastStep.providers) {
        const pid = `${lastStep.id}/${p.name}`;
        edges.push({
          id: `e-${pid}-exit`,
          source: pid,
          target: "exit",
          animated: true,
          style: { stroke: "#d97706", strokeDasharray: "5 3" },
        });
      }
    }

    return { nodes, edges };
  }, [recipe, stateMap]);

  return (
    <div className="h-[400px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#262626" gap={24} />
      </ReactFlow>
    </div>
  );
}
