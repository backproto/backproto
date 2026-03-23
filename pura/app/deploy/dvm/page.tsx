"use client";

import { useState } from "react";
import Link from "next/link";
import s from "../deploy.module.css";

const DVM_KINDS = [
  { kind: 5000, name: "Text-to-text", desc: "Translation, summarization, text generation" },
  { kind: 5001, name: "Text-to-image", desc: "Image generation from text prompts" },
  { kind: 5002, name: "Image-to-text", desc: "OCR, captioning, visual Q&A" },
  { kind: 5003, name: "Image-to-image", desc: "Style transfer, upscaling, editing" },
  { kind: 5050, name: "Discovery", desc: "Content discovery and recommendation" },
  { kind: 5250, name: "Text-to-audio", desc: "TTS, music generation" },
];

export default function DeployDVMPage() {
  const [selectedKind, setSelectedKind] = useState<number | null>(null);
  const [endpoint, setEndpoint] = useState("");
  const [pubkey, setPubkey] = useState("");

  return (
    <main className={s.main}>
      <div className={s.head}>
        <span style={{ color: "var(--color-deploy, #d97706)" }}>── DEPLOY / DVM</span>
        <hr className={s.rule} />
      </div>

      <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: "1.5rem", lineHeight: 1.6 }}>
        Register a NIP-90 Data Vending Machine with the Pura protocol. Your DVM
        gets capacity monitoring, completion verification, congestion pricing, and
        proportional payment routing out of the box.
      </p>

      {/* Step 1: Choose kind */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
          1. choose NIP-90 job kind
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {DVM_KINDS.map((k) => (
            <button
              key={k.kind}
              onClick={() => setSelectedKind(k.kind)}
              style={{
                padding: "0.6rem 0.75rem",
                border: `1px solid ${selectedKind === k.kind ? "#d97706" : "#222"}`,
                background: selectedKind === k.kind ? "#1a1400" : "transparent",
                color: selectedKind === k.kind ? "#d97706" : "#888",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "0.72rem",
                transition: "border-color 0.15s",
              }}
            >
              <strong>Kind {k.kind}</strong> — {k.name}
              <br />
              <span style={{ color: "#666", fontSize: "0.65rem" }}>{k.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: Configure */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
          2. configure endpoint
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.7rem", color: "#888" }}>
            DVM endpoint URL
            <input
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="wss://your-dvm.example.com"
              style={{
                display: "block",
                width: "100%",
                marginTop: "0.25rem",
                padding: "0.5rem",
                background: "#0d0d0d",
                border: "1px solid #333",
                color: "#e0e0e0",
                fontFamily: "monospace",
                fontSize: "0.75rem",
              }}
            />
          </label>
          <label style={{ fontSize: "0.7rem", color: "#888" }}>
            Nostr public key (hex)
            <input
              type="text"
              value={pubkey}
              onChange={(e) => setPubkey(e.target.value)}
              placeholder="npub or hex pubkey"
              style={{
                display: "block",
                width: "100%",
                marginTop: "0.25rem",
                padding: "0.5rem",
                background: "#0d0d0d",
                border: "1px solid #333",
                color: "#e0e0e0",
                fontFamily: "monospace",
                fontSize: "0.75rem",
              }}
            />
          </label>
        </div>
      </section>

      {/* Step 3: What happens */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
          3. what Pura does for your DVM
        </div>
        <ul style={{ fontSize: "0.72rem", color: "#888", lineHeight: 1.8, paddingLeft: "1rem" }}>
          <li>Registers with DVMCapacityAdapter — capacity is EWMA-smoothed and normalized</li>
          <li>Completions verified via DVMCompletionVerifier — dual-signed receipts</li>
          <li>Pricing set by DVMPricingCurve — congestion-adjusted per job kind</li>
          <li>Settlement via your choice of rail: Superfluid stream, Lightning HTLC, or direct ERC-20</li>
          <li>Shadow mode available — monitor before committing to on-chain registration</li>
        </ul>
      </section>

      {/* Deploy button */}
      <button
        disabled={!selectedKind || !endpoint}
        style={{
          padding: "0.7rem 1.5rem",
          border: "1px solid #d97706",
          background: selectedKind && endpoint ? "#d97706" : "transparent",
          color: selectedKind && endpoint ? "#000" : "#555",
          cursor: selectedKind && endpoint ? "pointer" : "not-allowed",
          fontFamily: "monospace",
          fontSize: "0.78rem",
          fontWeight: 600,
        }}
      >
        {selectedKind && endpoint ? "register DVM →" : "choose kind and endpoint to continue"}
      </button>

      <p style={{ fontSize: "0.65rem", color: "#555", marginTop: "1rem" }}>
        On-chain registration requires a wallet connected to Base Sepolia.{" "}
        <Link href="/deploy" style={{ color: "#d97706" }}>← back to deploy hub</Link>
      </p>
    </main>
  );
}
