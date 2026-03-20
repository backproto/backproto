import Link from "next/link";
import type { Recipe } from "@/lib/types";

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

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const allProviders = recipe.steps.flatMap((s) => s.providers);
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-accent)]/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors leading-tight">
          {recipe.name}
        </h3>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-mono ${domainColors[recipe.domain] || domainColors.general}`}
        >
          {recipe.domain}
        </span>
      </div>

      <p className="text-sm text-[var(--color-text-muted)] mb-4 line-clamp-2">
        {recipe.description}
      </p>

      {/* Mini pipeline preview */}
      <div className="flex items-center gap-2 mb-4">
        {recipe.steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2">
            <div className="rounded bg-[var(--color-border)] px-2 py-1 text-xs font-mono text-[var(--color-text-muted)]">
              {step.id}
              <span className="ml-1 text-[var(--color-accent)]">
                ×{step.providers.length}
              </span>
            </div>
            {i < recipe.steps.length - 1 && (
              <span className="text-[var(--color-border)]">→</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex flex-wrap gap-1.5">
          {recipe.contracts_used.slice(0, 4).map((c) => (
            <span
              key={c}
              className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[var(--color-text-muted)]"
            >
              {c}
            </span>
          ))}
          {recipe.contracts_used.length > 4 && (
            <span className="text-[var(--color-text-muted)]">
              +{recipe.contracts_used.length - 4}
            </span>
          )}
        </div>
        <span
          className={`font-mono ${difficultyColors[recipe.difficulty] || ""}`}
        >
          {recipe.difficulty}
        </span>
      </div>
    </Link>
  );
}
