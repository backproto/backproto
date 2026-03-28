"use client";

import { useState } from "react";
import styles from "./page.module.css";

export function CopyAnchor({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  function handleClick() {
    const url = `${window.location.origin}/diagrams#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button type="button" onClick={handleClick} className={styles.anchorTag} title="Copy link">
      {copied ? "copied!" : `#${id}`}
    </button>
  );
}
