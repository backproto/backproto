import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.line}>
        backproto ·{" "}
        <a href="https://backproto.io" target="_blank" rel="noopener noreferrer">
          docs
        </a>{" "}
        ·{" "}
        <a href="https://github.com/backproto" target="_blank" rel="noopener noreferrer">
          github
        </a>{" "}
        · base sepolia
      </span>
    </footer>
  );
}
