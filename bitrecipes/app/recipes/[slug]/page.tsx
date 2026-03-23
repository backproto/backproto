import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RecipeDetailClient } from "@/components/RecipeDetailClient";
import { getRecipeBySlug, getAllRecipes, getRawYaml } from "@/lib/recipes";
import Link from "next/link";

export function generateStaticParams() {
  return getAllRecipes().map((r) => ({ slug: r.slug }));
}

const domainColors: Record<string, string> = {
  ai: "bg-blue-900/50 text-blue-300",
  nostr: "bg-purple-900/50 text-purple-300",
  general: "bg-gray-800/50 text-gray-300",
  infrastructure: "bg-emerald-900/50 text-emerald-300",
  defi: "bg-amber-900/50 text-amber-300",
};

const difficultyColors: Record<string, string> = {
  beginner: "text-[var(--color-green)]",
  intermediate: "text-[var(--color-yellow)]",
  advanced: "text-[var(--color-red)]",
};

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();

  const rawYaml = getRawYaml("recipes", slug);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/recipes"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-4 inline-block"
          >
            ← All recipes
          </Link>
          <div className="flex items-start gap-4 mb-3">
            <h1 className="text-3xl font-bold">{recipe.name}</h1>
            <span
              className={`mt-1 shrink-0 rounded px-2 py-0.5 text-xs font-mono ${domainColors[recipe.domain] || ""}`}
            >
              {recipe.domain}
            </span>
            <span
              className={`mt-1.5 text-xs font-mono ${difficultyColors[recipe.difficulty] || ""}`}
            >
              {recipe.difficulty}
            </span>
          </div>
          <p className="text-[var(--color-text-muted)] max-w-2xl">
            {recipe.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {recipe.contracts_used.map((c) => (
              <span
                key={c}
                className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-mono text-[var(--color-text-muted)]"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Interactive section */}
        <RecipeDetailClient recipe={recipe} rawYaml={rawYaml} />

        {/* Deploy guide */}
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-4">How to deploy</h2>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 font-mono text-sm space-y-2">
            <p className="text-[var(--color-text-muted)]">
              # Install the CLI
            </p>
            <p>npm install -g @pura/bake</p>
            <p className="text-[var(--color-text-muted)] mt-4">
              # Fork this recipe
            </p>
            <p>bake fork {recipe.slug}</p>
            <p className="text-[var(--color-text-muted)] mt-4">
              # Simulate with fault injection
            </p>
            <p>bake sim --chaos</p>
            <p className="text-[var(--color-text-muted)] mt-4">
              # Deploy to Base Sepolia
            </p>
            <p>bake deploy</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
