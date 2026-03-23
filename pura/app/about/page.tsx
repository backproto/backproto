"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "2rem 1rem",
        fontFamily: "var(--font-mono, monospace)",
        color: "#e0e0e0",
      }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <span
          style={{
            fontSize: "0.8rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--amber, #d97706)",
          }}
        >
          ── ABOUT
        </span>
        <hr style={{ border: "none", borderTop: "1px solid #333", margin: "0.4rem 0 0" }} />
      </div>

      <p style={{ fontSize: "0.78rem", color: "#888", lineHeight: 1.6, marginBottom: "1.5rem" }}>
        Pura is an open protocol for verified machine service coordination. It
        makes capacity observable, completions verifiable, and payments
        proportional to actual throughput. The protocol runs on Base (Ethereum L2)
        and integrates with Nostr for decentralized service discovery.
      </p>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
          the protocol in numbers
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.75rem",
          }}
        >
          <tbody>
            {[
              ["Smart contracts", "32 (Solidity 0.8.26, Base Sepolia)"],
              ["Test coverage", "319+ tests (Foundry)"],
              ["Settlement rails", "Superfluid streaming, Lightning HTLC, direct ERC-20"],
              ["Service types", "Nostr relays, NIP-90 DVMs, LLM endpoints, AI agents"],
              ["Verification", "Dual-signed EIP-712 completion receipts"],
              ["Pricing model", "Congestion-adjusted (Boltzmann routing + EWMA capacity)"],
              ["License", "MIT"],
            ].map(([label, value]) => (
              <tr key={label}>
                <td
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderBottom: "1px solid #1a1a1a",
                    color: "#666",
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderBottom: "1px solid #1a1a1a",
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
          links
        </div>
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.72rem" }}>
          <a
            href="https://github.com/pura-xyz"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#d97706" }}
          >
            github
          </a>
          <Link href="/paper" style={{ color: "#d97706" }}>
            paper
          </Link>
          <Link href="/docs" style={{ color: "#d97706" }}>
            docs
          </Link>
          <Link href="/deploy" style={{ color: "#d97706" }}>
            deploy
          </Link>
          <Link href="/monitor" style={{ color: "#d97706" }}>
            monitor
          </Link>
        </div>
      </div>
    </main>
  );
}
