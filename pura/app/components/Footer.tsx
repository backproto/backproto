import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.session}>[pura]</span>
        <Link href="/" className={styles.win}>
          0:dashboard<span className={styles.active}>*</span>
        </Link>
        <Link href="/docs" className={styles.win}>
          1:docs<span className={styles.inactive}>-</span>
        </Link>
        <Link href="/paper" className={styles.win}>
          2:paper<span className={styles.inactive}>-</span>
        </Link>
        <Link href="/blog" className={styles.win}>
          3:blog<span className={styles.inactive}>-</span>
        </Link>
        <Link href="/deploy" className={styles.win}>
          5:deploy<span className={styles.inactive}>-</span>
        </Link>
        <Link href="/monitor" className={styles.win}>
          6:monitor<span className={styles.inactive}>-</span>
        </Link>
        <Link href="/simulate" className={styles.win}>
          7:sim<span className={styles.inactive}>-</span>
        </Link>
        <Link href="/pricing" className={styles.win}>
          8:pricing<span className={styles.inactive}>-</span>
        </Link>
      </div>
      <div className={styles.right}>
        <a
          href="https://github.com/pura-xyz"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ext}
        >
          github
        </a>
        <span className={styles.sep}>│</span>
        <span className={styles.ts}>MIT</span>
      </div>
    </footer>
  );
}
