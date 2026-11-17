import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, LogoSymbol } from "@/components/brand/Logo";
import { UserMenu } from "@/components/account/UserMenu";
import { cx } from "@/lib/cx";
import styles from "./AppHeader.module.css";

/**
 * Header of the signed-in screens: the logo on the left (back to Home), the screen's
 * controls in the center and the user menu on the right. Only its controls are glass.
 */
export function AppHeader({ children, end, className }: { children?: ReactNode; end?: ReactNode; className?: string }) {
  return (
    <header className={cx(styles.header, className)}>
      <div className={styles.lead}>
        <Link href="/app" className={styles.logoLink} aria-label="WorkBoard, ir a Inicio">
          <span className={styles.logoFull}>
            <Logo height={24} />
          </span>
          <LogoSymbol className={styles.logoSymbol} />
        </Link>
      </div>
      <div className={styles.center}>{children}</div>
      <div className={styles.end}>
        {end}
        <UserMenu />
      </div>
    </header>
  );
}
