export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8 mt-20">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
        <span>MIT License · Backproto Contributors 2026</span>
        <div className="flex items-center gap-6">
          <a
            href="https://backproto.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-text)] transition-colors"
          >
            backproto.io
          </a>
          <a
            href="https://github.com/backproto"
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
