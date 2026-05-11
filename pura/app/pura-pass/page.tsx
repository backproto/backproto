import Link from "next/link";

export const metadata = {
  title: "Pura Pass (beta) — Pura",
  description: "Human-backed agent keys with proof, budget controls, routing, and receipts.",
};

export default function PuraPassPage() {
  return (
    <main
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "2rem 1rem 2.5rem",
        color: "var(--text)",
      }}
    >
      <section style={{ marginBottom: "1.2rem" }}>
        <div
          style={{
            display: "inline-block",
            fontFamily: "var(--font-mono)",
            fontSize: "0.68rem",
            color: "#111",
            background: "var(--amber)",
            border: "1px solid var(--amber)",
            borderRadius: "999px",
            padding: "0.16rem 0.55rem",
            marginBottom: "0.6rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 700,
          }}
        >
          planned beta
        </div>
        <h1
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1.35rem",
            margin: "0 0 0.45rem",
          }}
        >
          Human-backed agent keys
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--text-muted)",
            lineHeight: 1.65,
            maxWidth: 760,
            fontSize: "0.9rem",
          }}
        >
          Verify a human once. Delegate a budgeted API key to your agent. Pura enforces quota,
          routes workload under backpressure, settles usage, and emits receipts per request.
        </p>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1.1rem 0" }} />

      <section style={{ display: "grid", gap: "0.85rem", marginBottom: "1.15rem" }}>
        <article style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "0.8rem 0.9rem" }}>
          <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", margin: "0 0 0.4rem" }}>What it is</h2>
          <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.82rem" }}>
            Pura Pass is a proof-aware key tier for the gateway. Issuer adapters verify personhood proofs,
            then keys inherit quota and routing policy from proof class.
          </p>
        </article>

        <article style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "0.8rem 0.9rem" }}>
          <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", margin: "0 0 0.4rem" }}>Why it matters</h2>
          <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.82rem" }}>
            Free-tier abuse and anonymous high-volume traffic are admission-control problems. Proof-aware keys
            let apps keep open access while reserving higher weekly quota for unique-human sessions.
          </p>
        </article>

        <article style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "0.8rem 0.9rem" }}>
          <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", margin: "0 0 0.4rem" }}>What ships first</h2>
          <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.82rem" }}>
            World ID adapter, weekly proof-gated free credits, proof headers in gateway responses,
            and a human-fallback demo that routes low-confidence prompts to verified reviewers.
          </p>
        </article>
      </section>

      <section style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
        <Link
          href="/blog/admission-control-and-flow-control"
          style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "0.45rem 0.75rem",
            color: "var(--text)",
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
            fontSize: "0.76rem",
          }}
        >
          read thesis
        </Link>
        <Link
          href="/gateway"
          style={{
            border: "1px solid var(--amber)",
            borderRadius: 10,
            padding: "0.45rem 0.75rem",
            color: "var(--amber)",
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
            fontSize: "0.76rem",
          }}
        >
          gateway docs
        </Link>
      </section>
    </main>
  );
}
