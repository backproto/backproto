import styles from "../page.module.css";
import Accent from "../components/Accent";
import CodeBlock from "../components/CodeBlock";

export const metadata = {
  title: "Cascade routing vs. direct pricing — Pura",
  description:
    "Head-to-head cost comparison: cascade routing across Groq, Gemini, OpenAI, and Anthropic vs. sending everything to one provider.",
};

const PROVIDERS = [
  { name: "Groq", model: "Llama 3.3 70B", cost: 0.0003, tier: 1 },
  { name: "Gemini", model: "Gemini 2.0 Flash", cost: 0.0005, tier: 2 },
  { name: "Anthropic", model: "Claude Sonnet", cost: 0.003, tier: 3 },
  { name: "OpenAI", model: "GPT-4o", cost: 0.005, tier: 4 },
];

/**
 * Simulated 1,000-request distribution.
 * 75% resolve at tier 1, 15% escalate to tier 2, 7% to tier 3, 3% to tier 4.
 */
const SIMULATION = {
  total: 1000,
  distribution: [
    { tier: 1, pct: 75, requests: 750, provider: "Groq", cost: 0.0003 },
    { tier: 2, pct: 15, requests: 150, provider: "Gemini", cost: 0.0005 },
    { tier: 3, pct: 7, requests: 70, provider: "Anthropic", cost: 0.003 },
    { tier: 4, pct: 3, requests: 30, provider: "OpenAI", cost: 0.005 },
  ],
  avgTokensPerRequest: 800,
};

function computeCascadeCost() {
  const tokensPerReq = SIMULATION.avgTokensPerRequest;
  let total = 0;
  for (const tier of SIMULATION.distribution) {
    total += tier.requests * (tokensPerReq / 1000) * tier.cost;
  }
  return total;
}

function computeDirectCost(costPer1K: number) {
  return (
    SIMULATION.total * (SIMULATION.avgTokensPerRequest / 1000) * costPer1K
  );
}

export default function ComparePage() {
  const cascadeCost = computeCascadeCost();
  const directOpenAI = computeDirectCost(0.005);
  const directAnthropic = computeDirectCost(0.003);
  const savingsVsOpenAI = ((1 - cascadeCost / directOpenAI) * 100).toFixed(0);
  const savingsVsAnthropic = (
    (1 - cascadeCost / directAnthropic) *
    100
  ).toFixed(0);

  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Cascade routing vs. direct pricing</h1>
        <p className={styles.subtitle}>
          Cascade routing starts every request at the cheapest provider. If the
          response quality is low, it escalates to the next tier. You only pay
          premium prices when the cheap answer was genuinely not good enough.
        </p>
      </header>

      <hr className={styles.divider} />

      {/* provider costs */}
      <section className={styles.section}>
        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "0.6rem",
          }}
        >
          Provider costs per 1K tokens
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th>tier</th>
                <th>provider</th>
                <th>model</th>
                <th>cost / 1K tokens</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDERS.map((p) => (
                <tr key={p.name}>
                  <td>{p.tier}</td>
                  <td>{p.name}</td>
                  <td style={{ color: "var(--text-dim)" }}>{p.model}</td>
                  <td className={p.tier === 1 ? styles.highlightCol : undefined}>
                    ${p.cost.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p
          className={styles.desc}
          style={{ marginTop: "0.5rem" }}
        >
          Tier 1 costs <Accent tone="lightning">17x less</Accent> than tier 4.
          Cascade routing sends 70-80% of requests to tier 1.
        </p>
      </section>

      <hr className={styles.divider} />

      {/* 1000-request simulation */}
      <section className={styles.section}>
        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "0.6rem",
          }}
        >
          1,000 requests: cascade vs. direct
        </h2>
        <p className={styles.desc}>
          Simulated distribution based on typical agent workloads (~800
          tokens/request average).
        </p>

        <div style={{ overflowX: "auto" }}>
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th>tier</th>
                <th>provider</th>
                <th>requests</th>
                <th>% of total</th>
                <th>cost</th>
              </tr>
            </thead>
            <tbody>
              {SIMULATION.distribution.map((d) => (
                <tr key={d.tier}>
                  <td>{d.tier}</td>
                  <td>{d.provider}</td>
                  <td>{d.requests}</td>
                  <td>{d.pct}%</td>
                  <td>
                    $
                    {(
                      d.requests *
                      (SIMULATION.avgTokensPerRequest / 1000) *
                      d.cost
                    ).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.8rem",
            marginTop: "1rem",
          }}
        >
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0.6rem 0.7rem",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "var(--amber, #d97706)",
                marginBottom: "0.2rem",
              }}
            >
              CASCADE
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              ${cascadeCost.toFixed(4)}
            </span>
          </div>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0.6rem 0.7rem",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "var(--text-dim)",
                marginBottom: "0.2rem",
              }}
            >
              ALL GPT-4o
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--red, #ef4444)",
              }}
            >
              ${directOpenAI.toFixed(4)}
            </span>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                color: "var(--text-dim)",
                marginTop: "0.15rem",
              }}
            >
              {savingsVsOpenAI}% more expensive
            </span>
          </div>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0.6rem 0.7rem",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "var(--text-dim)",
                marginBottom: "0.2rem",
              }}
            >
              ALL CLAUDE
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--red, #ef4444)",
              }}
            >
              ${directAnthropic.toFixed(4)}
            </span>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                color: "var(--text-dim)",
                marginTop: "0.15rem",
              }}
            >
              {savingsVsAnthropic}% more expensive
            </span>
          </div>
        </div>
      </section>

      <hr className={styles.divider} />

      {/* how cascade works */}
      <section className={styles.section}>
        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "0.6rem",
          }}
        >
          How cascade routing decides
        </h2>
        <p className={styles.desc}>
          After each tier responds, four signals determine whether to accept or
          escalate.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th>signal</th>
                <th>weight</th>
                <th>what it checks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Refusal detection</td>
                <td>30%</td>
                <td style={{ color: "var(--text-dim)" }}>
                  &quot;As an AI...&quot;, &quot;I cannot help with...&quot;,
                  content policy triggers
                </td>
              </tr>
              <tr>
                <td>Completeness</td>
                <td>30%</td>
                <td style={{ color: "var(--text-dim)" }}>
                  Did the response actually address the question?
                </td>
              </tr>
              <tr>
                <td>Hedging language</td>
                <td>25%</td>
                <td style={{ color: "var(--text-dim)" }}>
                  &quot;It depends&quot;, &quot;I&apos;m not sure&quot;,
                  &quot;generally speaking&quot;
                </td>
              </tr>
              <tr>
                <td>Length ratio</td>
                <td>15%</td>
                <td style={{ color: "var(--text-dim)" }}>
                  Response length vs. expected for the task complexity
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p
          className={styles.desc}
          style={{ marginTop: "0.5rem" }}
        >
          Combined score above 0.7 = accept. Below 0.7 = escalate to the next
          tier. Maximum 3 escalations.
        </p>
      </section>

      <hr className={styles.divider} />

      {/* quick start */}
      <section className={styles.section}>
        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "0.6rem",
          }}
        >
          Try it
        </h2>
        <p className={styles.desc}>
          One env var change. OpenAI SDK compatible.
        </p>
        <CodeBlock
          language="python"
          label="python"
          tone="auth"
          code={`from openai import OpenAI

client = OpenAI(
    base_url="https://api.pura.xyz/v1",
    api_key="pura_YOUR_KEY"  # free for 5,000 requests
)

response = client.chat.completions.create(
    model="auto",  # cascade routing picks the model
    messages=[{"role": "user", "content": "What is 2+2?"}]
)

# Check response headers for cost info:
# X-Pura-Model, X-Pura-Cost, X-Pura-Tier`}
        />
        <CodeBlock
          language="bash"
          label="curl"
          tone="stream"
          code={`curl https://api.pura.xyz/v1/chat/completions \\
  -H "Authorization: Bearer pura_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"What is 2+2?"}]}'`}
        />
        <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem" }}>
          <a href="/gateway" className={styles.ctaPrimary}>
            get an API key →
          </a>
          <a
            href="/docs/getting-started-gateway"
            className={styles.ctaSecondary}
          >
            quickstart docs →
          </a>
        </div>
      </section>

      <hr className={styles.divider} />

      <footer className={styles.ecosystem}>
        <span>Pura Gateway</span>
        <span className={styles.ecosystemSep}>·</span>
        <span>Cascade Routing</span>
        <span className={styles.ecosystemSep}>·</span>
        <span>Free for 5,000 requests</span>
        <span className={styles.ecosystemSep}>·</span>
        <a
          href="https://github.com/puraxyz/puraxyz"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ecosystemLink}
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
