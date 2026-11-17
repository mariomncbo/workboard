import { Logo } from "@/components/brand/Logo";
import styles from "./auth.module.css";

/** Logo and one-line explanation at the top of each sign-in screen. */
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.logoHeading}>
        <Logo height={50} />
        <span className="visually-hidden">{title}</span>
      </h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
}
