"use client";

import { useEffect, useRef } from "react";
import styles from "./CascadeViz.module.css";

/* ── Layout ────────────────────────────────────────────────────── */
const CANVAS_H = 260;
const PAD_X = 40;
const PAD_Y = 28;
const NODE_W = 120;
const NODE_H = 30;
const TIER_GAP = 0.22;

/* ── Provider tiers (top to bottom = cheapest to most expensive) ─ */
interface Tier {
  id: string;
  label: string;
  price: string;
  color: string;
  y: number;
}

const TIERS: Tier[] = [
  { id: "groq",      label: "Groq",      price: "$0.0003/1k", color: "#f97316", y: 0.15 },
  { id: "gemini",    label: "Gemini",     price: "$0.0005/1k", color: "#3b82f6", y: 0.38 },
  { id: "openai",    label: "OpenAI",     price: "$0.005/1k",  color: "#22c55e", y: 0.62 },
  { id: "anthropic", label: "Anthropic",  price: "$0.03/1k",   color: "#8b5cf6", y: 0.85 },
];

/* ── Request particle ──────────────────────────────────────────── */
interface Particle {
  /** Current animation time 0-1 across the full journey */
  t: number;
  speed: number;
  /** Index into TIERS where this request resolves (0 = groq, 3 = anthropic) */
  resolveTier: number;
  /** Current phase: "approach" | "check" | "cascade" | "exit" */
  phase: "approach" | "check" | "cascade" | "exit";
  /** Which tier the particle is currently at */
  currentTier: number;
  /** Phase-local progress 0-1 */
  phaseT: number;
  opacity: number;
}

/* ── Helpers ───────────────────────────────────────────────────── */
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function hexAlpha(hex: string, alpha: string) {
  return hex.slice(0, 7) + alpha;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/* ── Resolved layout positions ─────────────────────────────────── */
interface Layout {
  reqX: number; reqY: number;
  resX: number; resY: number;
  tiers: { px: number; py: number; tier: Tier }[];
  w: number; h: number; dpr: number;
}

function resolveLayout(cw: number, ch: number, dpr: number): Layout {
  const reqX = PAD_X + 0.04 * (cw - 2 * PAD_X);
  const reqY = PAD_Y + 0.5 * (ch - 2 * PAD_Y);
  const resX = PAD_X + 0.92 * (cw - 2 * PAD_X);
  const resY = reqY;
  const tiers = TIERS.map((tier) => ({
    px: PAD_X + 0.42 * (cw - 2 * PAD_X),
    py: PAD_Y + tier.y * (ch - 2 * PAD_Y),
    tier,
  }));
  return { reqX, reqY, resX, resY, tiers, w: cw, h: ch, dpr };
}

/* ── Component ─────────────────────────────────────────────────── */
export default function CascadeViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    const canvas = canvasEl;

    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let layout: Layout = resolveLayout(100, 100, 1);
    let particles: Particle[] = [];
    let tick = 0;
    let running = true;
    let visible = true;
    let raf = 0;

    /* ── Weighted random resolve tier ─────────────────────── */
    // ~70% tier 0, ~15% tier 1, ~10% tier 2, ~5% tier 3
    function pickResolveTier(): number {
      const r = Math.random();
      if (r < 0.70) return 0;
      if (r < 0.85) return 1;
      if (r < 0.95) return 2;
      return 3;
    }

    function spawnParticle() {
      particles.push({
        t: 0,
        speed: 0.008 + Math.random() * 0.006,
        resolveTier: pickResolveTier(),
        phase: "approach",
        currentTier: 0,
        phaseT: 0,
        opacity: 0.6 + Math.random() * 0.3,
      });
    }

    /* ── Simulation step ──────────────────────────────────── */
    function updateSim() {
      tick++;
      if (tick % 30 === 0) spawnParticle();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.phaseT += p.speed * 1.8;

        if (p.phase === "approach") {
          if (p.phaseT >= 1) {
            p.phase = "check";
            p.phaseT = 0;
          }
        } else if (p.phase === "check") {
          if (p.phaseT >= 1) {
            if (p.currentTier >= p.resolveTier) {
              // Confidence passed — exit to response
              p.phase = "exit";
              p.phaseT = 0;
            } else {
              // Cascade down
              p.phase = "cascade";
              p.phaseT = 0;
            }
          }
        } else if (p.phase === "cascade") {
          if (p.phaseT >= 1) {
            p.currentTier++;
            p.phase = "check";
            p.phaseT = 0;
          }
        } else if (p.phase === "exit") {
          if (p.phaseT >= 1) {
            particles.splice(i, 1);
            continue;
          }
        }

        p.t += p.speed;
      }

      if (particles.length > 12) particles.splice(0, particles.length - 12);
    }

    /* ── Draw ─────────────────────────────────────────────── */
    function drawEndpointNode(
      x: number, y: number, label: string, color: string,
    ) {
      const nw = 72;
      const nh = 28;
      roundRect(ctx!, x - nw / 2, y - nh / 2, nw, nh, nh / 2);
      ctx!.fillStyle = hexAlpha(color, "18");
      ctx!.fill();
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 1;
      ctx!.globalAlpha = 0.5;
      roundRect(ctx!, x - nw / 2, y - nh / 2, nw, nh, nh / 2);
      ctx!.stroke();
      ctx!.globalAlpha = 0.85;
      ctx!.font = "500 9px var(--font-sans, system-ui)";
      ctx!.fillStyle = "#e0e0e6";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillText(label, x, y);
      ctx!.globalAlpha = 1;
    }

    function drawTierNode(px: number, py: number, tier: Tier) {
      const nw = NODE_W;
      const nh = NODE_H;
      roundRect(ctx!, px - nw / 2, py - nh / 2, nw, nh, 5);
      ctx!.fillStyle = hexAlpha(tier.color, "14");
      ctx!.fill();
      ctx!.strokeStyle = tier.color;
      ctx!.lineWidth = 1;
      ctx!.globalAlpha = 0.4;
      roundRect(ctx!, px - nw / 2, py - nh / 2, nw, nh, 5);
      ctx!.stroke();
      ctx!.globalAlpha = 0.85;
      // Label
      ctx!.font = "600 9px var(--font-sans, system-ui)";
      ctx!.fillStyle = "#e0e0e6";
      ctx!.textAlign = "left";
      ctx!.textBaseline = "middle";
      ctx!.fillText(tier.label, px - nw / 2 + 10, py);
      // Price
      ctx!.font = "500 7.5px var(--font-mono, monospace)";
      ctx!.fillStyle = "#808090";
      ctx!.textAlign = "right";
      ctx!.fillText(tier.price, px + nw / 2 - 10, py);
      ctx!.globalAlpha = 1;
    }

    function drawCascadeArrows() {
      ctx!.setLineDash([3, 4]);
      ctx!.strokeStyle = "#8b5cf640";
      ctx!.lineWidth = 1;
      for (let i = 0; i < layout.tiers.length - 1; i++) {
        const from = layout.tiers[i];
        const to = layout.tiers[i + 1];
        ctx!.beginPath();
        ctx!.moveTo(from.px, from.py + NODE_H / 2 + 2);
        ctx!.lineTo(to.px, to.py - NODE_H / 2 - 2);
        ctx!.stroke();
      }
      ctx!.setLineDash([]);
    }

    function drawStaticEdges() {
      ctx!.setLineDash([]);
      ctx!.strokeStyle = "#47556930";
      ctx!.lineWidth = 1;
      // Request → first tier
      ctx!.beginPath();
      ctx!.moveTo(layout.reqX + 36, layout.reqY);
      ctx!.lineTo(layout.tiers[0].px - NODE_W / 2, layout.tiers[0].py);
      ctx!.stroke();
      // Each tier → response (faint, shows potential exit)
      for (const t of layout.tiers) {
        ctx!.beginPath();
        ctx!.moveTo(t.px + NODE_W / 2, t.py);
        ctx!.lineTo(layout.resX - 36, layout.resY);
        ctx!.globalAlpha = 0.08;
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }
    }

    function drawParticles() {
      for (const p of particles) {
        const tier = layout.tiers[p.currentTier];
        if (!tier) continue;
        const color = tier.tier.color;
        let px: number, py: number;

        if (p.phase === "approach") {
          // Request node → first tier
          const target = layout.tiers[0];
          px = lerp(layout.reqX + 36, target.px - NODE_W / 2, p.phaseT);
          py = lerp(layout.reqY, target.py, p.phaseT);
        } else if (p.phase === "check") {
          // Pulse at current tier
          px = tier.px;
          py = tier.py;
          // Draw confidence ring
          const ringRadius = 14 + p.phaseT * 8;
          const willPass = p.currentTier >= p.resolveTier;
          const ringColor = willPass ? "#4ade80" : "#fbbf24";
          ctx!.beginPath();
          ctx!.arc(px, py, ringRadius, 0, Math.PI * 2);
          ctx!.strokeStyle = ringColor;
          ctx!.lineWidth = 1.5;
          ctx!.globalAlpha = (1 - p.phaseT) * 0.6 * p.opacity;
          ctx!.stroke();
          ctx!.globalAlpha = 1;
        } else if (p.phase === "cascade") {
          // Move down to next tier
          const next = layout.tiers[p.currentTier + 1];
          if (!next) continue;
          px = lerp(tier.px, next.px, p.phaseT);
          py = lerp(tier.py + NODE_H / 2, next.py - NODE_H / 2, p.phaseT);
        } else {
          // Exit: tier → response
          px = lerp(tier.px + NODE_W / 2, layout.resX - 36, p.phaseT);
          py = lerp(tier.py, layout.resY, p.phaseT);
        }

        // Glow
        ctx!.beginPath();
        ctx!.arc(px, py, 5, 0, Math.PI * 2);
        const grad = ctx!.createRadialGradient(px, py, 0, px, py, 5);
        grad.addColorStop(0, hexAlpha(color, "50"));
        grad.addColorStop(1, "transparent");
        ctx!.fillStyle = grad;
        ctx!.fill();

        // Dot
        ctx!.beginPath();
        ctx!.arc(px, py, 2, 0, Math.PI * 2);
        ctx!.fillStyle = "#e0e0e6";
        ctx!.globalAlpha = p.opacity;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }
    }

    function draw() {
      const { w, h, dpr } = layout;
      ctx!.clearRect(0, 0, w * dpr, h * dpr);
      ctx!.save();
      ctx!.scale(dpr, dpr);

      drawStaticEdges();
      drawCascadeArrows();

      // Endpoint nodes
      drawEndpointNode(layout.reqX, layout.reqY, "Request", "#71717a");
      drawEndpointNode(layout.resX, layout.resY, "Response", "#4ade80");

      // Tier nodes
      for (const t of layout.tiers) drawTierNode(t.px, t.py, t.tier);

      // Particles
      drawParticles();

      ctx!.restore();
    }

    /* ── Resize ───────────────────────────────────────────── */
    function handleResize() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const newDpr = Math.min(window.devicePixelRatio || 1, 2);
      const newW = Math.round(rect.width * newDpr);
      const newH = Math.round(rect.height * newDpr);
      if (canvas.width === newW && canvas.height === newH) return;
      canvas.width = newW;
      canvas.height = newH;
      layout = resolveLayout(rect.width, rect.height, newDpr);
    }

    handleResize();
    draw();

    const ro = new ResizeObserver(() => { handleResize(); draw(); });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting; },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    function loop() {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (visible && !prefersReduced) updateSim();
      draw();
    }
    loop();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div className={styles.wrap}>
      <div
        className={styles.container}
        style={{ height: CANVAS_H }}
        role="img"
        aria-label="Cascade routing diagram: requests try the cheapest provider first, check confidence, and cascade to the next tier only when needed"
      >
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <p className={styles.caption}>
        70–80% of requests resolve at the cheapest tier
      </p>
    </div>
  );
}
