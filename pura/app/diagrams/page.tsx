import Link from "next/link";
import AnimatedDiagram from "../components/AnimatedDiagram";
import AnimatedSequence from "../components/AnimatedSequence";
import {
  DIAGRAM_CATALOG,
  DIAGRAM_CATEGORIES,
  type DiagramCatalogEntry,
} from "@/lib/diagramCatalog";
import styles from "./page.module.css";
import { CopyAnchor } from "./CopyAnchor";

export const metadata = { title: "Diagrams" };

function renderEntry(entry: DiagramCatalogEntry) {
  if (entry.kind === "sequence") {
    return <AnimatedSequence {...entry.sequence} />;
  }

  return <AnimatedDiagram {...entry.diagram} />;
}

export default function DiagramsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>diagram gallery</p>
        <h1>Every live diagram in one place</h1>
        <p className={styles.subtitle}>
          This is the visual index for the site. Each entry shows the diagram itself, what it is trying to explain, and where it appears in the product, docs, or explainer.
        </p>
        <div className={styles.jumpRow}>
          {DIAGRAM_CATEGORIES.map((category) => (
            <a key={category.id} href={`#${category.id}`} className={styles.jumpLink}>
              {category.label}
            </a>
          ))}
        </div>
      </header>

      {DIAGRAM_CATEGORIES.map((category) => {
        const entries = DIAGRAM_CATALOG.filter((entry) => entry.category === category.id);
        return (
          <section key={category.id} id={category.id} className={styles.section}>
            <div className={styles.sectionHead}>
              <span>{category.label}</span>
              <hr className={styles.rule} />
            </div>
            <div className={styles.stack}>
              {entries.map((entry) => (
                <article key={entry.id} id={entry.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.cardMeta}>{entry.kind === "sequence" ? "sequence" : "diagram"}</p>
                      <h2>{entry.title}</h2>
                    </div>
                    <CopyAnchor id={entry.id} />
                  </div>
                  <p className={styles.summary}>{entry.summary}</p>
                  <div className={styles.preview}>{renderEntry(entry)}</div>
                  <div className={styles.locationBlock}>
                    <p className={styles.locationLabel}>Appears on</p>
                    <div className={styles.locationLinks}>
                      {entry.locations.map((location) => (
                        <Link key={`${entry.id}-${location.href}`} href={location.href} className={styles.locationLink}>
                          {location.label} →
                        </Link>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}