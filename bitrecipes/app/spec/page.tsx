import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export default function SpecPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-16 prose-invert">
        <h1 className="text-3xl font-bold mb-8">Recipe spec</h1>

        <div className="space-y-8 text-[var(--color-text)]">
          <section>
            <h2 className="text-xl font-bold mb-3">Overview</h2>
            <p className="text-[var(--color-text-muted)]">
              A recipe is a YAML file that declares a complete Backproto
              pipeline: the providers, their pricing curves, routing policy,
              settlement contracts, and observability configuration. The format
              is machine-readable (for the <code>bake</code> CLI and simulation
              engine) and human-readable (for the web gallery and documentation).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Top-level fields</h2>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left px-4 py-2 font-mono text-[var(--color-accent)]">Field</th>
                    <th className="text-left px-4 py-2 font-mono text-[var(--color-accent)]">Type</th>
                    <th className="text-left px-4 py-2 font-mono text-[var(--color-accent)]">Required</th>
                    <th className="text-left px-4 py-2 text-[var(--color-text-muted)]">Description</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-2">name</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">string</td>
                    <td className="px-4 py-2 text-[var(--color-green)]">yes</td>
                    <td className="px-4 py-2 font-sans text-[var(--color-text-muted)]">Human-readable recipe name</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-2">description</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">string</td>
                    <td className="px-4 py-2 text-[var(--color-green)]">yes</td>
                    <td className="px-4 py-2 font-sans text-[var(--color-text-muted)]">One-line description</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-2">domain</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">enum</td>
                    <td className="px-4 py-2 text-[var(--color-green)]">yes</td>
                    <td className="px-4 py-2 font-sans text-[var(--color-text-muted)]">ai | nostr | general | infrastructure | defi</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-2">difficulty</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">enum</td>
                    <td className="px-4 py-2 text-[var(--color-green)]">yes</td>
                    <td className="px-4 py-2 font-sans text-[var(--color-text-muted)]">beginner | intermediate | advanced</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-2">contracts_used</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">string[]</td>
                    <td className="px-4 py-2 text-[var(--color-green)]">yes</td>
                    <td className="px-4 py-2 font-sans text-[var(--color-text-muted)]">Backproto contracts this recipe uses</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-2">steps</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">Step[]</td>
                    <td className="px-4 py-2 text-[var(--color-green)]">yes</td>
                    <td className="px-4 py-2 font-sans text-[var(--color-text-muted)]">Ordered pipeline stages</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-2">funding</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">object</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">no</td>
                    <td className="px-4 py-2 font-sans text-[var(--color-text-muted)]">EscrowBuffer address + Superfluid config</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-2">routing</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">object</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">no</td>
                    <td className="px-4 py-2 font-sans text-[var(--color-text-muted)]">Policy, fairness, provider constraints</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-2">settlement</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">object</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">no</td>
                    <td className="px-4 py-2 font-sans text-[var(--color-text-muted)]">Pool address, tracker, penalty config</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">observability</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">object</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">no</td>
                    <td className="px-4 py-2 font-sans text-[var(--color-text-muted)]">Export targets (otel, json, webhook)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Provider object</h2>
            <p className="text-[var(--color-text-muted)] mb-4">
              Each step contains one or more providers. A provider declares an
              endpoint, a capacity attestor address, stake requirements, and
              pricing curve parameters.
            </p>
            <pre className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm font-mono text-[var(--color-text)] overflow-x-auto">
{`providers:
  - name: vLLM-A
    endpoint: "https://provider-a.example/run"
    capacityAttestor: "0x6f58..."
    stake:
      manager: "0xdc26..."
      min: "500 USDC"
    pricingCurve:
      base: 0.0008   # base price at 0% utilization
      k: 0.15        # sensitivity coefficient
      alpha: 2.0     # convexity exponent`}
            </pre>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Pricing curve formula</h2>
            <p className="text-[var(--color-text-muted)]">
              <code>price = base × (1 + k × utilization^alpha)</code>
            </p>
            <p className="text-[var(--color-text-muted)] mt-2">
              At 0% utilization the price equals <code>base</code>. As
              utilization rises, price increases according to a power curve
              controlled by <code>k</code> (sensitivity) and{" "}
              <code>alpha</code> (convexity). Higher alpha means prices stay
              flat longer then spike harder near capacity.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
