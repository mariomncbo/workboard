import styles from "./auth.module.css";

/** Horizontal rule with a short text in the middle: "o entra con otra cuenta". */
export function OrSeparator({ text }: { text: string }) {
  return (
    <div className={styles.separator} role="separator">
      <span className={styles.separatorText}>{text}</span>
    </div>
  );
}
