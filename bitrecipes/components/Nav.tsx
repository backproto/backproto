import Link from "next/link";

const links = [
  { href: "/recipes", label: "Recipes" },
  { href: "/patterns", label: "Patterns" },
  { href: "/spec", label: "Spec" },
  { href: "/cli", label: "CLI" },
  { href: "/about", label: "About" },
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-mono text-lg font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
        >
          bit.recipes
        </Link>
        <div className="flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://github.com/backproto/bitrecipes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://backproto.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            backproto.io
          </a>
        </div>
      </div>
    </nav>
  );
}
