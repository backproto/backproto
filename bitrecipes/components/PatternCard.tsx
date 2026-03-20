import Link from "next/link";
import type { AtomicPattern } from "@/lib/types";

const difficultyColors: Record<string, string> = {
  beginner: "text-[var(--color-green)]",
  intermediate: "text-[var(--color-yellow)]",
  advanced: "text-[var(--color-red)]",
};

export function PatternCard({ pattern }: { pattern: AtomicPattern }) {
  return (
    <Link
      href={`/patterns/${pattern.slug}`}
      className="group block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-accent)]/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors leading-tight">
          {pattern.name}
        </h3>
        <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs font-mono text-[var(--color-text-muted)]">
          {pattern.contract}
        </span>
      </div>

      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        {pattern.description}
      </p>

      <span
        className={`text-xs font-mono ${difficultyColors[pattern.difficulty] || ""}`}
      >
        {pattern.difficulty}
      </span>
    </Link>
  );
}
