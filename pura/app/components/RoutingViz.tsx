import styles from "./RoutingViz.module.css";

export function RoutingViz() {
  return (
    <div className={styles.wrap}>
      <div className={styles.nodes}>
        <div className={`${styles.node} ${styles.nodeRelay}`}>
          <span className={styles.nodeLabel}>relay</span>
          <div className={styles.nodeBox}>NIP-01</div>
          <div className={styles.capBar}><div className={styles.capFill} /></div>
          <span className={styles.capLabel}>72% spare</span>
        </div>
        <div className={`${styles.node} ${styles.nodeDvm}`}>
          <span className={styles.nodeLabel}>dvm</span>
          <div className={styles.nodeBox}>NIP-90</div>
          <div className={styles.capBar}><div className={styles.capFill} /></div>
          <span className={styles.capLabel}>45% spare</span>
        </div>
        <div className={`${styles.node} ${styles.nodeLlm}`}>
          <span className={styles.nodeLabel}>llm</span>
          <div className={styles.nodeBox}>GPT-4</div>
          <div className={styles.capBar}><div className={styles.capFill} /></div>
          <span className={styles.capLabel}>12% spare</span>
        </div>
        <div className={`${styles.node} ${styles.nodeAgent}`}>
          <span className={styles.nodeLabel}>agent</span>
          <div className={styles.nodeBox}>CLAW</div>
          <div className={styles.capBar}><div className={styles.capFill} /></div>
          <span className={styles.capLabel}>65% spare</span>
        </div>
      </div>

      {/* payment stream lines */}
      <div className={styles.streams}>
        <div className={`${styles.stream} ${styles.stream1}`} />
        <div className={`${styles.stream} ${styles.stream2}`} />
        <div className={`${styles.stream} ${styles.stream3}`} />
      </div>

      {/* reroute arc (BPE skipping congested LLM) */}
      <div className={styles.reroute}>
        <div className={styles.reroutePath} />
        <span className={styles.rerouteLabel}>reroute → spare capacity</span>
      </div>
    </div>
  );
}
