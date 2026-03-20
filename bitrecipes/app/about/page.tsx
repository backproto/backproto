import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-8">About bit.recipes</h1>

        <div className="space-y-6 text-[var(--color-text-muted)]">
          <p>
            bit.recipes is the Backproto cookbook: a visual, executable pipeline
            builder where each recipe is a declarative YAML spec that wires
            together providers, capacity signals, pricing curves, and streaming
            payments into a working pipeline.
          </p>

          <p>
            Recipes can be browsed in the gallery, forked with one click,
            simulated in-browser with live congestion visualization, and deployed
            to Base Sepolia via the <code>bake</code> CLI.
          </p>

          <h2 className="text-xl font-bold text-[var(--color-text)] mt-10 mb-3">
            How it connects to Backproto
          </h2>
          <p>
            Backproto is an on-chain protocol for backpressure-driven capacity
            markets. Providers declare spare capacity via EIP-712 attestations.
            Consumers pay streaming payments proportional to utilized capacity.
            Pricing curves make overloaded providers expensive, and routing
            automatically shifts load to providers with headroom.
          </p>
          <p>
            bit.recipes makes this machinery composable and approachable.
            Instead of reading contract source code, you read a recipe. Instead
            of writing deployment scripts, you run <code>bake deploy</code>.
            Instead of guessing how backpressure routing works, you watch it
            happen in the simulator.
          </p>

          <h2 className="text-xl font-bold text-[var(--color-text)] mt-10 mb-3">
            Open source
          </h2>
          <p>
            Everything here is MIT-licensed. Fork a recipe, build a business on
            it, run your own instance. The protocol is open, the tooling is
            open, the recipes are open.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
