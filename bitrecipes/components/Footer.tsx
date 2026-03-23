export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8 mt-20">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
        <span>MIT License · Pura Contributors 2026</span>
        <div className="flex items-center gap-6">
          <a
            href="https://pura.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-text)] transition-colors"
          >
            pura.xyz
          </a>
          <a
            href="https://github.com/pura-xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-text)] transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
