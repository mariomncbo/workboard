import styles from "./Spinner.module.css";

/** Small activity indicator. The surrounding control announces what is loading. */
export function Spinner({ size = 14 }: { size?: number }) {
  return <span className={styles.spinner} style={{ width: size, height: size }} aria-hidden="true" />;
}
