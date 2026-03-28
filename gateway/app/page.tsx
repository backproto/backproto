"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import FlowDiagram from "./components/FlowDiagram";
import CascadeViz from "./components/CascadeViz";
import styles from "./page.module.css";
import { generateSeedState } from "@/lib/seed";

interface SinkState {
  name: string;
  configured: boolean;
  address?: string;
  units?: string;
  completionRate?: string;
  completions?: string;
  price?: string;
}

interface GatewayState {
  providers: string[];
  sinks: SinkState[];
  pool: string | null;
  baseFee: string;
  chainId: number;
  keys: { total: number; totalRequests: number; withWallet: number };
  seed?: boolean;
}

export default function Home() {
  const [state, setState] = useState<GatewayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyLabel, setKeyLabel] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        const hasData = data.sinks?.some((s: SinkState) => s.configured && s.completions !== "0");
        if (hasData) {
          setState(data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // skip
    }
    setState((prev) => prev?.seed ? prev : generateSeedState());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 30_000);
    return () => clearInterval(interval);
  }, [fetchState]);

  async function handleGenerateKey(e: FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setGeneratedKey("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: keyLabel }),
      });
      const data = await res.json();
      if (data.key) {
        setGeneratedKey(data.key);
        setKeyLabel("");
        fetchState();
      }
    } catch {
      // skip
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.logo}>⚡</span> pura<span className={styles.tagSuffix}>api</span>
        </h1>
        <nav className={styles.headerNav}>
          <a
            href="#how-it-works"
            className={styles.headerLink}
          >
            how it works
          </a>
          <a
            href="https://pura.xyz/docs"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.headerLink}
          >
            docs
          </a>
          <a
            href="https://pura.xyz/paper"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.headerLink}
          >
            paper
          </a>
          <a
            href="https://github.com/puraxyz/puraxyz/tree/main/gateway"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.headerLink}
            aria-label="GitHub"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          </a>
        </nav>
      </header>

      <p className={styles.subtitle}>
        Cascade-routed LLM gateway · 4 providers, one endpoint
      </p>

      {state?.seed && (
        <div className={styles.seedBanner}>
          ◈ Simulated data · Connect providers for live metrics
        </div>
      )}

      <section className={styles.hero}>
        <div className={styles.heroViz}>
          <CascadeViz />
        </div>
      </section>

      <FlowDiagram />

      {/* Key generation */}
      <section className={styles.keySection}>
        <form className={styles.keyForm} onSubmit={handleGenerateKey}>
          <input
            type="text"
            className={styles.keyInput}
            placeholder="Label (optional)"
            value={keyLabel}
            onChange={(e) => setKeyLabel(e.target.value)}
            maxLength={64}
          />
          <button
            type="submit"
            className={styles.keyButton}
            disabled={generating}
          >
            {generating ? "…" : "Get API Key"}
          </button>
        </form>
        {generatedKey && (
          <>
            <div className={styles.keyResult}>{generatedKey}</div>
            <p className={styles.keyWarning}>
              ⚠ Copy this key now — it will not be shown again.
            </p>
          </>
        )}
      </section>

      {/* Stats */}
      {state && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Providers</div>
            <div className={styles.statValue}>{state.providers.length}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Total Requests</div>
            <div className={styles.statValue}>{state.keys.totalRequests}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>API Keys</div>
            <div className={styles.statValue}>{state.keys.total}</div>
          </div>
        </div>
      )}

      {/* Provider cards */}
      {state && (
        <div className={styles.providers}>
          {state.sinks.map((sink) => (
            <div key={sink.name} className={styles.providerCard}>
              <div className={styles.providerName}>
                <span
                  className={styles.providerDot}
                  style={{
                    background: sink.configured ? "var(--green)" : "var(--text-dim)",
                  }}
                />
                {sink.name}
              </div>
              {sink.configured && (
                <dl className={styles.providerMeta}>
                  <dt>Units</dt>
                  <dd>{sink.units ?? "—"}</dd>
                  <dt>Completions</dt>
                  <dd>{sink.completions ?? "—"}</dd>
                  <dt>Price</dt>
                  <dd>{sink.price ?? "—"}</dd>
                </dl>
              )}
              {!sink.configured && (
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                  Not configured
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick start */}
      <section className={styles.usage}>
        <h3 className={styles.usageTitle}>Quick start</h3>
        <pre className={styles.compact}>{`curl ${typeof window !== "undefined" ? window.location.origin : "https://api.pura.xyz"}/api/chat \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{"messages":[{"role":"user","content":"Hello!"}],"stream":true}'

# Or bring your own provider key:
curl ${typeof window !== "undefined" ? window.location.origin : "https://api.pura.xyz"}/api/chat \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "X-Provider-Key: sk-your-openai-key" \\
  -d '{"messages":[{"role":"user","content":"Hello!"}],"model":"gpt-4o"}'`}</pre>
      </section>

      {/* FAQ */}
      <section className={`${styles.faq} ${styles.howItWorks}`} id="how-it-works">
        <h3 className={styles.faqTitle}>Common questions</h3>

        <div className={styles.faqItem}>
          <h4 className={styles.faqQ}>How does this work?</h4>
          <p className={styles.faqA}>
            You send requests using the standard OpenAI chat format. The gateway
            scores each request&apos;s complexity and routes to the cheapest provider
            that can handle it. If the response looks weak — hedging, too short,
            refusal — it cascades up to the next tier automatically.
          </p>
        </div>

        <div className={styles.faqItem}>
          <h4 className={styles.faqQ}>Are my API keys secure?</h4>
          <p className={styles.faqA}>
            Your Pura API key is SHA-256 hashed before storage — we never
            store it in plaintext. If you bring your own provider key via the{" "}
            <code>X-Provider-Key</code> header, it is used only for the single
            outbound request to the provider, then discarded. It is never stored,
            never logged, and never included in error responses.
          </p>
        </div>

        <div className={styles.faqItem}>
          <h4 className={styles.faqQ}>Can I use my own provider key?</h4>
          <p className={styles.faqA}>
            Yes. Pass your OpenAI or Anthropic key via the{" "}
            <code>X-Provider-Key</code> header and set the <code>model</code>{" "}
            parameter to route to the right provider. Your key is used
            pass-through for that single request — the gateway never stores it. If
            you don&apos;t send a provider key, the gateway uses its own managed
            keys.
          </p>
        </div>

        <div className={styles.faqItem}>
          <h4 className={styles.faqQ}>What&apos;s the catch?</h4>
          <p className={styles.faqA}>
            First 5,000 requests are free, no signup required. After that, fund a
            Lightning wallet — pennies per request. You can stop anytime.
          </p>
        </div>

        <div className={styles.faqItem}>
          <h4 className={styles.faqQ}>Can I self-host this?</h4>
          <p className={styles.faqA}>
            Yes — the gateway is fully open source. Fork it, deploy it, run your own
            gateway. See the{" "}
            <a
              href="https://github.com/puraxyz/puraxyz/tree/main/gateway"
              target="_blank"
              rel="noopener noreferrer"
            >
              operator guide
            </a>.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerLinks}>
            <a href="#how-it-works">how it works</a>
            <a href="https://pura.xyz/docs" target="_blank" rel="noopener noreferrer">docs</a>
            <a href="https://pura.xyz/paper" target="_blank" rel="noopener noreferrer">paper</a>
            <a href="https://pura.xyz/compare" target="_blank" rel="noopener noreferrer">compare</a>
          </div>
          <div className={styles.footerLinks}>
            <a
              href="https://github.com/puraxyz/puraxyz/tree/main/gateway"
              target="_blank"
              rel="noopener noreferrer"
            >
              github
            </a>
            <a
              href="https://github.com/puraxyz/puraxyz/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              report an issue
            </a>
          </div>
        </div>
        <div className={styles.footerBottom}>api.pura.xyz</div>
      </footer>
    </main>
  );
}
