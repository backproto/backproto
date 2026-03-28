import styles from "../page.module.css";

export const metadata = {
  title: "Shadow mode",
  description: "See what Pura would do — without changing anything.",
};

export default function ShadowPage() {
  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <h1 className={styles.title}>
          See what Pura would do — without changing anything.
        </h1>
        <p className={styles.subtitle}>
          The shadow sidecar sits next to your current setup and
          logs what cascade routing would have done for each request.
          No traffic redirect. No config changes. Just data.
        </p>
      </header>

      <hr className={styles.divider} />

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span style={{ color: "var(--amber)" }}>{"── "}INSTALL</span>
          <hr className={styles.rule} />
        </div>
        <pre className={styles.codePre}>{`npx @pura/shadow`}</pre>
        <p className={styles.desc} style={{ marginTop: "1rem" }}>
          The sidecar watches outbound LLM requests on your machine,
          runs them through the Pura confidence heuristic, and writes
          a comparison log. Takes about two minutes.
        </p>
      </section>

      <hr className={styles.divider} />

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span style={{ color: "var(--green)" }}>{"── "}WHAT YOU GET</span>
          <hr className={styles.rule} />
        </div>
        <pre className={styles.codePre} style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>{`Request #1
  Your routing:   GPT-4o         $0.034
  Pura cascade:   Groq (tier 1)  $0.0003
  Savings:        99.1%
  Confidence:     0.94

Request #2
  Your routing:   GPT-4o         $0.034
  Pura cascade:   Gemini (tier 2) $0.0008
  Savings:        97.6%
  Confidence:     0.87

Request #3
  Your routing:   GPT-4o         $0.034
  Pura cascade:   GPT-4o (tier 3) $0.034
  Savings:        0%
  Confidence:     0.42 → escalated to tier 3

Summary: 73% average savings across 3 requests`}</pre>
      </section>

      <hr className={styles.divider} />

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span style={{ color: "var(--text-dim)" }}>{"── "}READY TO SWITCH?</span>
          <hr className={styles.rule} />
        </div>
        <p className={styles.desc}>
          When you like what you see, change one line:
        </p>
        <pre className={styles.codePre}>{`const openai = new OpenAI({ baseURL: "https://api.pura.xyz/v1" });`}</pre>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a href="/gateway" className={styles.ctaPrimary}>get an API key →</a>
          <a href="/docs/getting-started-gateway" className={styles.ctaSecondary}>quickstart →</a>
        </div>
      </section>
    </main>
  );
}
