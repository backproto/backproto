import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PatternCard } from "@/components/PatternCard";
import { getAllPatterns } from "@/lib/recipes";

export default function PatternsPage() {
  const patterns = getAllPatterns();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Atomic patterns</h1>
        <p className="text-[var(--color-text-muted)] mb-10">
          Single-concept recipes showing one Pura primitive in isolation.
          Each pattern is referenced by full recipes that use it.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((p) => (
            <PatternCard key={p.slug} pattern={p} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
