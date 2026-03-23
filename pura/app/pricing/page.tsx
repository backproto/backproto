"use client";

import Link from "next/link";

const TIERS = [
  {
    name: "Shadow",
    price: "Free",
    features: [
      "Install @pura/shadow sidecar",
      "Capacity metrics collection",
      "BPE comparison reports",
      "No on-chain registration",
    ],
  },
  {
    name: "Operator",
    price: "$29/mo stream",
    features: [
      "On-chain capacity registration",
      "Completion verification",
      "Congestion pricing",
      "Payment pool revenue sharing",
      "Multi-service support",
      "Monitor dashboard access",
    ],
    highlight: true,
  },
  {
    name: "Protocol",
    price: "Custom",
    features: [
      "Everything in Operator",
      "Custom settlement rail config",
      "SLA guarantees",
      "Dedicated support",
      "Custom adapter development",
    ],
  },
];

export default function PricingPage() {
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
          ── PRICING
        </span>
        <hr style={{ border: "none", borderTop: "1px solid #333", margin: "0.4rem 0 0" }} />
      </div>

      <p
        style={{
          fontSize: "0.78rem",
          color: "#888",
          lineHeight: 1.6,
          marginBottom: "2rem",
        }}
      >
        Pura charges operators through Superfluid payment streams. Revenue from
        the protocol&apos;s payment pool is distributed proportional to verified
        throughput. Start with shadow mode for free — upgrade when you see the
        numbers.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            style={{
              border: `1px solid ${tier.highlight ? "#d97706" : "#222"}`,
              padding: "1.25rem",
              background: tier.highlight ? "#1a1400" : "transparent",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: tier.highlight ? "#d97706" : "#ccc",
                marginBottom: "0.3rem",
              }}
            >
              {tier.name}
            </div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              {tier.price}
            </div>
            <ul
              style={{
                fontSize: "0.7rem",
                color: "#888",
                lineHeight: 1.8,
                paddingLeft: "1rem",
                margin: 0,
              }}
            >
              {tier.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        style={{
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            fontSize: "0.7rem",
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.75rem",
          }}
        >
          payment pool mechanics
        </div>
        <p style={{ fontSize: "0.72rem", color: "#888", lineHeight: 1.6 }}>
          All service fees flow into a Superfluid GDA payment pool. Each epoch,
          the pool distributes funds to registered sinks proportional to their
          verified completion count and EWMA-smoothed capacity. Sinks that fail
          attestation or get slashed receive zero distribution for that epoch.
          The EscrowBuffer holds funds during verification windows — no payment
          is released until completion is dual-signed.
        </p>
      </div>

      <div style={{ fontSize: "0.7rem", color: "#555" }}>
        <Link href="/monitor" style={{ color: "#d97706" }}>
          monitor →
        </Link>{" "}
        |{" "}
        <Link href="/deploy" style={{ color: "#d97706" }}>
          deploy →
        </Link>{" "}
        |{" "}
        <Link href="/docs" style={{ color: "#d97706" }}>
          docs →
        </Link>
      </div>
    </main>
  );
}
