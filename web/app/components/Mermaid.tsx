"use client";

import { useEffect, useRef, useId } from "react";

export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "m");

  useEffect(() => {
    let cancelled = false;
    import("mermaid").then((m) => {
      if (cancelled) return;
      m.default.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#1e293b",
          primaryTextColor: "#e0e0e0",
          primaryBorderColor: "#334155",
          lineColor: "#475569",
          secondaryColor: "#1a1a1a",
          tertiaryColor: "#141414",
          edgeLabelBackground: "#1e293b",
          clusterBkg: "#0f172a",
          clusterBorder: "#334155",
          fontFamily:
            "var(--font-geist-mono), JetBrains Mono, Fira Code, monospace",
          fontSize: "14px",
        },
      });
      m.default.render(`mermaid-${id}`, chart).then(({ svg }) => {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          // Round corners on SVG rects and soften edge paths
          ref.current
            .querySelectorAll(".node rect, .node polygon, .cluster rect")
            .forEach((el) => {
              el.setAttribute("rx", "8");
              el.setAttribute("ry", "8");
            });
          ref.current
            .querySelectorAll(".edgeLabel rect")
            .forEach((el) => {
              el.setAttribute("rx", "6");
              el.setAttribute("ry", "6");
            });
          ref.current
            .querySelectorAll(".edgePath path")
            .forEach((el) => {
              el.setAttribute("stroke-width", "1.5");
            });
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return <div ref={ref} style={{ margin: "1.5rem 0", textAlign: "center" }} />;
}
