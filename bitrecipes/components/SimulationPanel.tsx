"use client";

import type { SimulationState, ProviderState } from "@/lib/types";

interface Props {
  state: SimulationState;
  loadFactor: number;
  onLoadChange: (v: number) => void;
  onKillProvider: (id: string) => void;
  onReviveProvider: (id: string) => void;
  onDegradeProvider: (id: string) => void;
  onSpikeLoad: () => void;
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
}

function Gauge({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      <span className="font-mono text-lg text-[var(--color-text)]">
        {typeof value === "number" ? value.toFixed(2) : value}
        <span className="text-xs text-[var(--color-text-muted)] ml-1">{unit}</span>
      </span>
    </div>
  );
}

function ProviderRow({
  p,
  onKill,
  onRevive,
  onDegrade,
}: {
  p: ProviderState;
  onKill: () => void;
  onRevive: () => void;
  onDegrade: () => void;
}) {
  const utilPct = Math.round(p.utilization * 100);
  const barColor =
    utilPct < 40
      ? "bg-[var(--color-green)]"
      : utilPct < 70
        ? "bg-[var(--color-yellow)]"
        : "bg-[var(--color-red)]";

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-28 truncate text-xs font-mono text-[var(--color-text)]">
        {p.name}
      </div>
      <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${p.alive ? utilPct : 0}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-mono text-[var(--color-text-muted)]">
        {p.alive ? `${utilPct}%` : "dead"}
      </span>
      <div className="flex gap-1">
        {p.alive ? (
          <>
            <button
              onClick={onKill}
              className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors"
            >
              kill
            </button>
            <button
              onClick={onDegrade}
              className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/60 transition-colors"
            >
              degrade
            </button>
          </>
        ) : (
          <button
            onClick={onRevive}
            className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-green-900/30 text-green-400 hover:bg-green-900/60 transition-colors"
          >
            revive
          </button>
        )}
      </div>
    </div>
  );
}

export function SimulationPanel({
  state,
  loadFactor,
  onLoadChange,
  onKillProvider,
  onReviveProvider,
  onDegradeProvider,
  onSpikeLoad,
  running,
  onToggle,
  onReset,
}: Props) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm font-mono text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          {running ? "Pause" : "Run"}
        </button>
        <button
          onClick={onReset}
          className="rounded-md border border-[var(--color-border)] px-4 py-1.5 text-sm font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onSpikeLoad}
          className="rounded-md border border-red-800 px-4 py-1.5 text-sm font-mono text-red-400 hover:bg-red-900/30 transition-colors"
        >
          Spike load
        </button>
      </div>

      {/* Load slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)]">Load</span>
          <span className="text-xs font-mono text-[var(--color-text)]">
            {Math.round(loadFactor * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(loadFactor * 100)}
          onChange={(e) => onLoadChange(Number(e.target.value) / 100)}
          className="w-full accent-[var(--color-accent)]"
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Gauge label="Allocation efficiency" value={state.allocationEfficiency} unit="" />
        <Gauge label="SLO compliance" value={state.sloCompliance} unit="" />
        <Gauge label="Reroutes" value={state.reroutes} unit="total" />
        <Gauge label="Gas estimate" value={state.gasCostEstimate} unit="ETH" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Gauge label="Total requests" value={state.totalRequests} unit="" />
        <Gauge label="Completed" value={state.completedRequests} unit="" />
        <Gauge label="Failed" value={state.failedRequests} unit="" />
        <Gauge label="Tick" value={state.tick} unit="" />
      </div>

      {/* Provider list */}
      <div className="space-y-1">
        <span className="text-xs text-[var(--color-text-muted)]">
          Providers
        </span>
        {state.providers.map((p) => (
          <ProviderRow
            key={p.id}
            p={p}
            onKill={() => onKillProvider(p.id)}
            onRevive={() => onReviveProvider(p.id)}
            onDegrade={() => onDegradeProvider(p.id)}
          />
        ))}
      </div>
    </div>
  );
}
