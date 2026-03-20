import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getPatternBySlug, getAllPatterns, getRawYaml } from "@/lib/recipes";
import Link from "next/link";

export function generateStaticParams() {
  return getAllPatterns().map((p) => ({ slug: p.slug }));
}

const difficultyColors: Record<string, string> = {
  beginner: "text-[var(--color-green)]",
  intermediate: "text-[var(--color-yellow)]",
  advanced: "text-[var(--color-red)]",
};

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pattern = getPatternBySlug(slug);
  if (!pattern) notFound();

  const rawYaml = getRawYaml("patterns", slug);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <Link
          href="/patterns"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-4 inline-block"
        >
          ← All patterns
        </Link>
        <div className="flex items-start gap-4 mb-3">
          <h1 className="text-3xl font-bold">{pattern.name}</h1>
          <span className="mt-1.5 shrink-0 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-mono text-[var(--color-text-muted)]">
            {pattern.contract}
          </span>
          <span
            className={`mt-1.5 text-xs font-mono ${difficultyColors[pattern.difficulty] || ""}`}
          >
            {pattern.difficulty}
          </span>
        </div>
        <p className="text-[var(--color-text-muted)] max-w-2xl mb-10">
          {pattern.description}
        </p>

        {rawYaml && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <pre className="text-sm font-mono text-[var(--color-text)] whitespace-pre-wrap">
              {rawYaml}
            </pre>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
