import styles from "./Logo.module.css";

type LogoProps = {
  /** Height of the symbol in pixels. 24 in headers, 50 on Login and Register. */
  height?: number;
};

/**
 * Horizontal WorkBoard logo for dark backgrounds: the symbol plus the name.
 * Geometry and proportions match brand/logo/workboard-horizontal-oscuro.svg. The name is
 * real text (system font, like the SVG), so it stays sharp and needs no font file.
 */
export function Logo({ height = 24 }: LogoProps) {
  return (
    <span
      className={styles.logo}
      style={{ "--logo-height": `${height}px` } as React.CSSProperties}
      role="img"
      aria-label="WorkBoard"
    >
      <LogoSymbol className={styles.symbol} />
      <span className={styles.name} aria-hidden="true">
        WorkBoard
      </span>
    </span>
  );
}

/** The symbol: a rounded white square with three dark lists that form a W. */
export function LogoSymbol({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <rect width="100" height="100" rx="22" fill="#eef0f4" />
      <rect x="14" y="14" width="20" height="72" rx="6" fill="#17181b" />
      <rect x="40" y="14" width="20" height="46" rx="6" fill="#17181b" />
      <rect x="66" y="14" width="20" height="72" rx="6" fill="#17181b" />
    </svg>
  );
}
