"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  runBenchmark,
  DEFAULT_CONFIG,
  type BenchmarkConfig,
  type BenchmarkResult,
} from "@/lib/benchmark";
import s from "./benchmark.module.css";

const COLORS: Record<string, string> = {
  random: "#ef4444",
  roundRobin: "#eab308",
  centralizedLB: "#3b82f6",
  bpe: "#22c55e",
};

function MiniChart({
  results,
  metric,
  label,
  yDomain,
}: {
  results: BenchmarkResult[];
  metric: keyof BenchmarkResult["series"];
  label: string;
  yDomain?: [number, number];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || results.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, w, h);

    // Axes
    const pad = { l: 40, r: 10, t: 20, b: 24 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + plotH);
    ctx.lineTo(pad.l + plotW, pad.t + plotH);
    ctx.stroke();

    // Find y range
    let yMin = yDomain?.[0] ?? Infinity;
    let yMax = yDomain?.[1] ?? -Infinity;
    if (!yDomain) {
      for (const r of results) {
        const data = r.series[metric];
        for (const v of data) {
          if (v < yMin) yMin = v;
          if (v > yMax) yMax = v;
        }
      }
      const margin = (yMax - yMin) * 0.1 || 0.1;
      yMin -= margin;
      yMax += margin;
    }

    // Y labels
    ctx.fillStyle = "#555";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const v = yMin + ((yMax - yMin) * i) / 4;
      const y = pad.t + plotH - (plotH * i) / 4;
      ctx.fillText(v.toFixed(2), pad.l - 4, y + 3);
      ctx.strokeStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
    }

    // X label
    ctx.textAlign = "center";
    ctx.fillStyle = "#555";
    ctx.fillText("timestep", pad.l + plotW / 2, pad.t + plotH + 18);

    // Title
    ctx.fillStyle = "#888";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(label, pad.l, pad.t - 6);

    // Plot lines
    for (const r of results) {
      const data = r.series[metric];
      if (data.length === 0) continue;
      ctx.strokeStyle = COLORS[r.strategy] || "#888";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = pad.l + (i / (data.length - 1)) * plotW;
        const y = pad.t + plotH - ((data[i] - yMin) / (yMax - yMin)) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, [results, metric, label, yDomain]);

  return <canvas ref={canvasRef} className={s.canvas} />;
}

export default function BenchmarkPage() {
  const [config, setConfig] = useState<BenchmarkConfig>(DEFAULT_CONFIG);
  const [running, setRunning] = useState(false);

  const results = useMemo(() => {
    setRunning(true);
    const r = runBenchmark(config);
    setRunning(false);
    return r;
  }, [config]);

  const update = useCallback(
    (key: keyof BenchmarkConfig, value: number) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const bpe = results.find((r) => r.strategy === "bpe");
  const lb = results.find((r) => r.strategy === "centralizedLB");
  const rr = results.find((r) => r.strategy === "roundRobin");

  return (
    <main className={s.main}>
      <div className={s.head}>
        <span style={{ color: "var(--amber, #d97706)" }}>
          ── SIMULATE / BENCHMARK
        </span>
        <hr className={s.rule} />
      </div>

      {/* Hero result */}
      <div className={s.hero}>
        <span className={s.heroLabel}>steady-state completion rate</span>
        <div className={s.heroValues}>
          <span style={{ color: COLORS.bpe }}>
            BPE: {((bpe?.avgCompletionRate ?? 0) * 100).toFixed(1)}%
          </span>
          <span style={{ color: COLORS.centralizedLB }}>
            LB: {((lb?.avgCompletionRate ?? 0) * 100).toFixed(1)}%
          </span>
          <span style={{ color: COLORS.roundRobin }}>
            RR: {((rr?.avgCompletionRate ?? 0) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className={s.controls}>
        <label className={s.control}>
          <span>providers</span>
          <input
            type="range"
            min={5}
            max={50}
            value={config.nSinks}
            onChange={(e) => update("nSinks", +e.target.value)}
          />
          <span className={s.val}>{config.nSinks}</span>
        </label>
        <label className={s.control}>
          <span>sources</span>
          <input
            type="range"
            min={2}
            max={20}
            value={config.nSources}
            onChange={(e) => update("nSources", +e.target.value)}
          />
          <span className={s.val}>{config.nSources}</span>
        </label>
        <label className={s.control}>
          <span>timesteps</span>
          <input
            type="range"
            min={100}
            max={2000}
            step={100}
            value={config.timesteps}
            onChange={(e) => update("timesteps", +e.target.value)}
          />
          <span className={s.val}>{config.timesteps}</span>
        </label>
        <label className={s.control}>
          <span>burst mult</span>
          <input
            type="range"
            min={1}
            max={5}
            step={0.5}
            value={config.burstMultiplier}
            onChange={(e) => update("burstMultiplier", +e.target.value)}
          />
          <span className={s.val}>{config.burstMultiplier}x</span>
        </label>
        <label className={s.control}>
          <span>temperature</span>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={config.temperature}
            onChange={(e) => update("temperature", +e.target.value)}
          />
          <span className={s.val}>τ={config.temperature}</span>
        </label>
        <label className={s.control}>
          <span>EWMA α</span>
          <input
            type="range"
            min={0.05}
            max={0.9}
            step={0.05}
            value={config.ewmaAlpha}
            onChange={(e) => update("ewmaAlpha", +e.target.value)}
          />
          <span className={s.val}>{config.ewmaAlpha}</span>
        </label>
      </div>

      {/* Charts */}
      <div className={s.charts}>
        <MiniChart
          results={results}
          metric="completionRate"
          label="completion rate"
          yDomain={[0, 1.05]}
        />
        <MiniChart
          results={results}
          metric="efficiency"
          label="allocation efficiency"
          yDomain={[0, 1.05]}
        />
        <MiniChart
          results={results}
          metric="fairness"
          label="fairness (Jain index)"
          yDomain={[0, 1.05]}
        />
        <MiniChart results={results} metric="maxBacklog" label="max queue backlog" />
      </div>

      {/* Legend */}
      <div className={s.legend}>
        {results.map((r) => (
          <span key={r.strategy} className={s.legendItem}>
            <span
              className={s.legendDot}
              style={{ background: COLORS[r.strategy] }}
            />
            {r.label}
          </span>
        ))}
      </div>

      {/* Summary table */}
      <div className={s.section}>
        <div className={s.sectionHead}>steady-state summary (last 20%)</div>
        <table className={s.tbl}>
          <thead>
            <tr>
              <th>strategy</th>
              <th>efficiency</th>
              <th>completion</th>
              <th>fairness</th>
              <th>burst recovery</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.strategy}>
                <td style={{ color: COLORS[r.strategy] }}>{r.label}</td>
                <td>{(r.avgEfficiency * 100).toFixed(1)}%</td>
                <td>{(r.avgCompletionRate * 100).toFixed(1)}%</td>
                <td>{r.avgFairness.toFixed(3)}</td>
                <td>{r.burstRecoverySteps} steps</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
