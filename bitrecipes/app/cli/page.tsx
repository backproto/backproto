import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export default function CliPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">bake CLI</h1>
        <p className="text-[var(--color-text-muted)] mb-10">
          The command-line tool for working with bit.recipes. Validate, simulate,
          and deploy Pura pipelines.
        </p>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Installation</h2>
          <pre className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono text-sm text-[var(--color-text)]">
            npm install -g @pura/bake
          </pre>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Quickstart</h2>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono text-sm space-y-1">
            <p className="text-[var(--color-text-muted)]"># Fork a recipe</p>
            <p className="text-[var(--color-text)]">bake fork llm-ensemble-router</p>
            <p className="text-[var(--color-text-muted)] mt-3"># Run a chaos simulation</p>
            <p className="text-[var(--color-text)]">bake sim --chaos</p>
            <p className="text-[var(--color-text-muted)] mt-3"># Deploy to Base Sepolia</p>
            <p className="text-[var(--color-text)]">bake deploy</p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold mb-4">Commands</h2>

          {[
            {
              cmd: "bake init <template>",
              desc: "Scaffold a new recipe from a named template or blank. Generates the YAML file, a README, and a basic test harness.",
            },
            {
              cmd: "bake validate",
              desc: "Validate a recipe YAML against the JSON Schema. Reports errors with line numbers and suggestions.",
            },
            {
              cmd: "bake test",
              desc: "Run the recipe against a local simulator with synthetic load. Spins up mock providers, generates requests, and outputs metrics.",
            },
            {
              cmd: "bake sim --chaos",
              desc: "Same as test but with fault injection: randomly kill providers, spike load, degrade capacity. Prints a comparison of Pura routing vs naive round-robin.",
            },
            {
              cmd: "bake deploy",
              desc: "Deploy the recipe to Base Sepolia. Registers providers in CapacityRegistry, configures PricingCurve parameters, funds the EscrowBuffer.",
            },
            {
              cmd: "bake fork <recipe-name>",
              desc: "Clone an existing recipe from the bit.recipes registry into a local directory. Prompts for customization of provider endpoints and pricing parameters.",
            },
            {
              cmd: "bake serve",
              desc: "Run a deployed recipe as a live service. Starts an HTTP gateway that routes requests via the configured Pura pipeline.",
            },
            {
              cmd: "bake publish",
              desc: "Publish a recipe to the bit.recipes public registry. Requires GitHub auth.",
            },
          ].map((c) => (
            <div
              key={c.cmd}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <code className="text-sm font-mono text-[var(--color-accent)]">
                {c.cmd}
              </code>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">
                {c.desc}
              </p>
            </div>
          ))}

          <p className="text-sm text-[var(--color-text-muted)]">
            All commands accept a <code>--json</code> flag for programmatic use.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
