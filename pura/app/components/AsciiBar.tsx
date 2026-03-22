interface AsciiBarProps {
  value: number;
  max: number;
  width?: number;
  color?: string;
  label?: string;
}

export function AsciiBar({
  value,
  max,
  width = 16,
  color,
  label,
}: AsciiBarProps) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const pct = Math.round(ratio * 100);

  return (
    <span
      style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", whiteSpace: "pre" }}
    >
      {label && (
        <span style={{ color: "var(--text-dim)", marginRight: 6 }}>{label}</span>
      )}
      <span style={{ color: "var(--text-dim)" }}>[</span>
      <span style={{ color: color ?? "var(--accent)" }}>
        {"█".repeat(filled)}
      </span>
      <span style={{ color: "var(--border-bright)" }}>
        {"░".repeat(empty)}
      </span>
      <span style={{ color: "var(--text-dim)" }}>]</span>
      <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>{pct}%</span>
    </span>
  );
}
