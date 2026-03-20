"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";

export function YamlViewer({ yaml }: { yaml: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-surface)] px-4 py-2 border-b border-[var(--color-border)]">
        <span className="text-xs font-mono text-[var(--color-text-muted)]">
          recipe.yaml
        </span>
        <button
          onClick={handleCopy}
          className="text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language="yaml"
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "16px",
          background: "#0a0a0a",
          fontSize: "13px",
        }}
      >
        {yaml}
      </SyntaxHighlighter>
    </div>
  );
}
