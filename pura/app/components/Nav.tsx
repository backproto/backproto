"use client";

import Link from "next/link";
import styles from "./Nav.module.css";

const SECTIONS = [
  { href: "/#relays", label: "relays", color: "var(--color-relays)" },
  { href: "/#lightning", label: "lightning", color: "var(--color-lightning)" },
  { href: "/#agents", label: "agents", color: "var(--color-agents)" },
  { href: "/#gateway", label: "gateway", color: "var(--color-gateway)" },
  { href: "/#sim", label: "sim", color: "var(--color-sim)" },
  { href: "/deploy", label: "deploy", color: "var(--color-deploy)" },
] as const;

export function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.brand}>
        <span className={styles.brandIcon}>◈</span> pura
      </Link>
      <div className={styles.links}>
        {SECTIONS.map((s) => (
          <a
            key={s.href}
            href={s.href}
            className={styles.link}
            style={{ "--link-color": s.color } as React.CSSProperties}
          >
            {s.label}
          </a>
        ))}
        <a
          href="https://backproto.io"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.external}
        >
          protocol ↗
        </a>
      </div>
    </nav>
  );
}
