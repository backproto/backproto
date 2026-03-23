"use client";

import { useEffect, useRef, useCallback } from "react";
import styles from "./BackpressureFlow.module.css";

/* ── Types ──────────────────────────────────────────────────────── */

interface Node {
  x: number;
  y: number;
  r: number;
  label: string;
  color: string;
  capacity: number;
  capDir: number;
  speed: number;
}

const enum PType {
  Payment = 0,   // sources → pool → sink (white)
  Capacity = 1,  // sink → pool (colored, small — capacity attestation)
  Overflow = 2,  // pool → escrow buffer (amber)
}

interface Particle {
  t: number;
  kind: PType;
  fromIdx: number;   // source index (Payment) or sink index (Capacity)
  toIdx: number;     // sink index (Payment) or -1 (Capacity → pool)
  speed: number;
  opacity: number;
  size: number;
  redirected: boolean;
}

/* ── Domain config ──────────────────────────────────────────────── */

const SINK_COLORS = [
  "#0d9488", "#6366f1", "#d97706", "#a16207",
  "#ec4899", "#8b5cf6", "#06b6d4", "#10b981",
];
const SINK_LABELS = [
  "AI Agents", "Nostr Relays", "Lightning", "DeFi Pools",
  "Compute", "Storage", "Oracles", "IoT Mesh",
];
const SOURCE_COLORS = ["#e4e4e7", "#a1a1aa", "#71717a"];
const SOURCE_LABELS = ["Apps", "Users", "Protocols"];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function ease(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

/* ── Component ──────────────────────────────────────────────────── */

export default function BackpressureFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  interface State {
    sources: Node[];
    pool: Node;
    buffer: Node;
    sinks: Node[];
    particles: Particle[];
    w: number; h: number; dpr: number; tick: number;
  }

  const stateRef = useRef<State | null>(null);

  const initState = useCallback((w: number, h: number, dpr: number): State => {
    const poolX = w * 0.32;
    const poolY = h * 0.45;

    const sources: Node[] = SOURCE_LABELS.map((label, i) => ({
      x: w * 0.06,
      y: h * (0.22 + i * 0.25),
      r: 12, label, color: SOURCE_COLORS[i],
      capacity: 0, capDir: 0, speed: 0,
    }));

    const pool: Node = {
      x: poolX, y: poolY, r: 22, label: "Pool",
      color: "#d97706", capacity: 0, capDir: 0, speed: 0,
    };

    const buffer: Node = {
      x: poolX, y: h * 0.88, r: 10, label: "Escrow",
      color: "#f59e0b", capacity: 0, capDir: 0, speed: 0,
    };

    // Fan sinks in arc
    const fanCX = w * 0.70;
    const fanRX = w * 0.24;
    const fanRY = h * 0.38;
    const n = SINK_COLORS.length;
    const arcS = -Math.PI * 0.42;
    const arcE = Math.PI * 0.42;

    const sinks: Node[] = SINK_COLORS.map((color, i) => {
      const angle = arcS + (arcE - arcS) * (i / (n - 1));
      return {
        x: fanCX + Math.cos(angle) * fanRX,
        y: poolY + Math.sin(angle) * fanRY,
        r: 14, label: SINK_LABELS[i], color,
        capacity: 0.1 + Math.random() * 0.3,
        capDir: 1, speed: 0.3 + Math.random() * 0.5,
      };
    });

    return { sources, pool, buffer, sinks, particles: [], w, h, dpr, tick: 0 };
  }, []);

  /* ── Bezier helpers ─────────────────────────────────────── */

  function bezier2(ax: number, ay: number, cx: number, cy: number, bx: number, by: number, t: number): [number, number] {
    const u = 1 - t;
    return [u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by];
  }

  function getPaymentPos(st: State, p: Particle): [number, number] {
    const src = st.sources[p.fromIdx];
    const pl = st.pool;
    const sk = st.sinks[p.toIdx];
    const t = ease(p.t);

    if (t < 0.45) {
      const lt = t / 0.45;
      return bezier2(src.x, src.y, lerp(src.x, pl.x, 0.5), lerp(src.y, pl.y, 0.3), pl.x, pl.y, lt);
    } else {
      const lt = (t - 0.45) / 0.55;
      return bezier2(pl.x, pl.y, lerp(pl.x, sk.x, 0.5), lerp(pl.y, sk.y, 0.3), sk.x, sk.y, lt);
    }
  }

  function getCapacityPos(st: State, p: Particle): [number, number] {
    const sk = st.sinks[p.fromIdx];
    const pl = st.pool;
    const t = ease(p.t);
    return bezier2(sk.x, sk.y, lerp(sk.x, pl.x, 0.5), lerp(sk.y, pl.y, 0.6), pl.x, pl.y, t);
  }

  function getOverflowPos(st: State, p: Particle): [number, number] {
    const pl = st.pool;
    const bf = st.buffer;
    const t = ease(p.t);
    return [lerp(pl.x, bf.x, t), lerp(pl.y, bf.y, t)];
  }

  /* ── Spawn particles ────────────────────────────────────── */

  function spawnPayment(st: State) {
    // Pick sink with lowest capacity (BPE routing)
    let best = 0, bestCap = st.sinks[0].capacity;
    for (let i = 1; i < st.sinks.length; i++) {
      if (st.sinks[i].capacity < bestCap) { best = i; bestCap = st.sinks[i].capacity; }
    }
    st.particles.push({
      t: 0, kind: PType.Payment,
      fromIdx: Math.floor(Math.random() * st.sources.length),
      toIdx: best,
      speed: 0.004 + Math.random() * 0.003,
      opacity: 0.6 + Math.random() * 0.4,
      size: 1.5 + Math.random() * 1.5,
      redirected: false,
    });
  }

  function spawnCapacity(st: State) {
    const idx = Math.floor(Math.random() * st.sinks.length);
    st.particles.push({
      t: 0, kind: PType.Capacity,
      fromIdx: idx, toIdx: -1,
      speed: 0.006 + Math.random() * 0.003,
      opacity: 0.35 + Math.random() * 0.25,
      size: 1.0 + Math.random() * 0.8,
      redirected: false,
    });
  }

  function spawnOverflow(st: State) {
    st.particles.push({
      t: 0, kind: PType.Overflow,
      fromIdx: -1, toIdx: -1,
      speed: 0.005 + Math.random() * 0.003,
      opacity: 0.5, size: 1.2,
      redirected: false,
    });
  }

  /* ── Simulation step ────────────────────────────────────── */

  function updateSim(st: State) {
    st.tick++;
    const mobile = typeof window !== "undefined" && window.innerWidth < 640;
    const rate = mobile ? 3 : 2;

    // Spawn payment particles
    if (st.tick % rate === 0) spawnPayment(st);

    // Spawn capacity signals (less frequent, flowing backward)
    if (st.tick % (rate * 4) === 0) spawnCapacity(st);

    // Overflow: when average capacity > 0.75, divert some to escrow
    const avgCap = st.sinks.reduce((s, k) => s + k.capacity, 0) / st.sinks.length;
    if (avgCap > 0.75 && st.tick % (rate * 3) === 0) spawnOverflow(st);

    // Update buffer capacity (fills from overflow, slowly drains)
    st.buffer.capacity = Math.min(0.95, st.buffer.capacity + (avgCap > 0.75 ? 0.003 : -0.006));
    st.buffer.capacity = Math.max(0, st.buffer.capacity);

    // Update sink capacities (oscillate)
    for (const k of st.sinks) {
      k.capacity += k.capDir * k.speed * 0.005;
      if (k.capacity >= 0.95) { k.capDir = -1; k.capacity = 0.95; }
      else if (k.capacity <= 0.05) { k.capDir = 1; k.capacity = 0.05; }
    }

    // Move particles
    for (let i = st.particles.length - 1; i >= 0; i--) {
      const p = st.particles[i];

      if (p.kind === PType.Payment) {
        const sink = st.sinks[p.toIdx];
        const capFactor = sink.capacity > 0.8 ? 0.3 : sink.capacity > 0.6 ? 0.6 : 1;

        // Redirect if saturated and still before pool
        if (!p.redirected && p.t < 0.4 && sink.capacity > 0.85) {
          let best = p.toIdx, bestC = sink.capacity;
          for (let j = 0; j < st.sinks.length; j++) {
            if (j !== p.toIdx && st.sinks[j].capacity < bestC) { best = j; bestC = st.sinks[j].capacity; }
          }
          if (best !== p.toIdx) { p.toIdx = best; p.redirected = true; }
        }

        p.t += p.speed * capFactor;
        if (p.t >= 1) {
          sink.capacity = Math.min(0.95, sink.capacity + 0.03);
          st.particles.splice(i, 1);
        }
      } else if (p.kind === PType.Capacity) {
        p.t += p.speed;
        if (p.t >= 1) st.particles.splice(i, 1);
      } else {
        p.t += p.speed;
        if (p.t >= 1) st.particles.splice(i, 1);
      }
    }
  }

  /* ── Draw ───────────────────────────────────────────────── */

  function drawFrame(ctx: CanvasRenderingContext2D, st: State) {
    const { w, h, dpr } = st;
    ctx.clearRect(0, 0, w * dpr, h * dpr);
    ctx.save();
    ctx.scale(dpr, dpr);

    const pl = st.pool;

    // ── Connection lines: sources → pool ────────────────────
    ctx.setLineDash([4, 6]);
    for (const src of st.sources) {
      ctx.strokeStyle = "#52525b";
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.quadraticCurveTo(lerp(src.x, pl.x, 0.5), lerp(src.y, pl.y, 0.3), pl.x, pl.y);
      ctx.stroke();
    }

    // ── Connection lines: pool → sinks (thickness ~ allocation weight) ──
    for (const k of st.sinks) {
      const weight = 1 - k.capacity; // more capacity free = thicker line
      ctx.strokeStyle = k.color;
      ctx.globalAlpha = 0.06 + weight * 0.14;
      ctx.lineWidth = 0.5 + weight * 1.5;
      ctx.beginPath();
      ctx.moveTo(pl.x, pl.y);
      ctx.quadraticCurveTo(lerp(pl.x, k.x, 0.5), lerp(pl.y, k.y, 0.3), k.x, k.y);
      ctx.stroke();
    }

    // ── Connection lines: sinks → pool (capacity signal, faint) ──
    for (const k of st.sinks) {
      ctx.strokeStyle = k.color;
      ctx.globalAlpha = 0.04;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(k.x, k.y);
      ctx.quadraticCurveTo(lerp(k.x, pl.x, 0.5), lerp(k.y, pl.y, 0.6), pl.x, pl.y);
      ctx.stroke();
    }

    // ── Connection line: pool → buffer ──
    ctx.strokeStyle = "#f59e0b";
    ctx.globalAlpha = 0.08 + st.buffer.capacity * 0.1;
    ctx.lineWidth = 0.5 + st.buffer.capacity;
    ctx.beginPath();
    ctx.moveTo(pl.x, pl.y);
    ctx.lineTo(st.buffer.x, st.buffer.y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // ── Particles ───────────────────────────────────────────
    for (const p of st.particles) {
      let px: number, py: number, glowColor: string, coreColor: string;

      if (p.kind === PType.Payment) {
        [px, py] = getPaymentPos(st, p);
        const sink = st.sinks[p.toIdx];
        glowColor = p.redirected ? "#f59e0b" : sink.color;
        coreColor = p.redirected ? "#f59e0b" : "#e4e4e7";
      } else if (p.kind === PType.Capacity) {
        [px, py] = getCapacityPos(st, p);
        glowColor = st.sinks[p.fromIdx].color;
        coreColor = glowColor;
      } else {
        [px, py] = getOverflowPos(st, p);
        glowColor = "#f59e0b";
        coreColor = "#f59e0b";
      }

      // Glow
      ctx.beginPath();
      ctx.arc(px, py, p.size * 4, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(px, py, 0, px, py, p.size * 4);
      grad.addColorStop(0, glowColor + "40");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = coreColor;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ── Draw nodes ──────────────────────────────────────────
    for (const src of st.sources) drawNode(ctx, src, false);
    drawNode(ctx, pl, false);
    drawNode(ctx, st.buffer, true);
    for (const k of st.sinks) drawNode(ctx, k, true);

    // ── Flow direction labels ───────────────────────────────
    ctx.font = "italic 8px var(--font-mono), monospace";
    ctx.fillStyle = "#52525b";
    ctx.textAlign = "center";

    const lx = lerp(st.sources[1].x, pl.x, 0.5);
    ctx.fillText("payments →", lx, pl.y - 22);

    const rx = lerp(pl.x, st.sinks[3].x, 0.35);
    ctx.fillText("distribute →", rx, pl.y - 22);

    const bx = lerp(st.sinks[3].x, pl.x, 0.35);
    ctx.fillText("← capacity signals", bx, pl.y + 28);

    ctx.restore();
  }

  function drawNode(ctx: CanvasRenderingContext2D, node: Node, showCapacity: boolean) {
    const { x, y, r, label, color, capacity } = node;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(x, y, r - 1, 0, Math.PI * 2);
    ctx.fillStyle = color + "15";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.font = "500 9px var(--font-mono), monospace";
    ctx.fillStyle = "#a1a1aa";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + r + 14);

    if (showCapacity) {
      const barW = r * 2.4;
      const barH = 2.5;
      const barX = x - barW / 2;
      const barY = y + r + 19;

      ctx.fillStyle = "#27272a";
      ctx.fillRect(barX, barY, barW, barH);

      const fillColor = capacity > 0.8 ? "#ef4444" : capacity > 0.6 ? "#eab308" : color;
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(barX, barY, barW * capacity, barH);
      ctx.globalAlpha = 1;
    }
  }

  /* ── Lifecycle ──────────────────────────────────────────── */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      if (!stateRef.current) {
        stateRef.current = initState(rect.width, rect.height, dpr);
      } else {
        const old = stateRef.current;
        const s = initState(rect.width, rect.height, dpr);
        for (let i = 0; i < s.sinks.length; i++) {
          s.sinks[i].capacity = old.sinks[i]?.capacity ?? s.sinks[i].capacity;
          s.sinks[i].capDir = old.sinks[i]?.capDir ?? s.sinks[i].capDir;
        }
        s.buffer.capacity = old.buffer.capacity;
        s.tick = old.tick;
        stateRef.current = s;
      }
    }

    resize();
    window.addEventListener("resize", resize);

    let running = true;
    function loop() {
      if (!running || !ctx || !stateRef.current) return;
      updateSim(stateRef.current);
      drawFrame(ctx, stateRef.current);
      frameRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [initState]);

  return (
    <div className={styles.flowContainer}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
