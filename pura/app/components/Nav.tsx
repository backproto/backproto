import Link from "next/link";
import styles from "./Nav.module.css";

export function Nav() {
  return (
    <nav className={styles.bar}>
      <div className={styles.left}>
        <Link href="/" className={styles.session}>
          [pura<span className={styles.active}>*</span>]
        </Link>
        <Link href="/docs" className={styles.tab}>
          1:docs<span className={styles.inactive}>-</span>
        </Link>
        <Link href="/paper" className={styles.tab}>
          2:paper<span className={styles.inactive}>-</span>
        </Link>
        <Link href="/blog" className={styles.tab}>
          3:blog<span className={styles.inactive}>-</span>
        </Link>
        <Link href="/explainer" className={styles.tab}>
          4:how<span className={styles.inactive}>-</span>
        </Link>
        <Link href="/deploy" className={styles.tab}>
          5:deploy<span className={styles.inactive}>-</span>
        </Link>
      </div>
      <div className={styles.right}>
        <span className={styles.net}>
          base-sepolia <span className={styles.dot}>●</span>
        </span>
      </div>
    </nav>
  );
}
