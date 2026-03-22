interface StatusDotProps {
  color: string;
  label?: string;
}

export function StatusDot({ color, label }: StatusDotProps) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem" }}>
      <span style={{ color }}>●</span>
      {label && (
        <span style={{ color: "var(--text-muted)", marginLeft: 5 }}>
          {label}
        </span>
      )}
    </span>
  );
}
