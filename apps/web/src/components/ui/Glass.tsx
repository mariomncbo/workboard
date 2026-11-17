import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";
import styles from "./Glass.module.css";

/*
 * Liquid Glass for the web, as defined by the design system. Only for the header and the
 * floating bar: never on cards, lists or tasks.
 */

type GlassButtonVariant =
  /** Glass capsule: the account button, board settings. */
  | "glass"
  /** Filled with the accent: "Crear". */
  | "prominent";

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: GlassButtonVariant;
  /** `circle` for icon-only or initials buttons (28 × 28). */
  shape?: "capsule" | "circle";
};

/** A standalone glass button (28 px). */
export function GlassButton({
  variant = "glass",
  shape = "capsule",
  type = "button",
  className,
  ...props
}: GlassButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles.standalone, styles[variant], styles[shape], className)}
      {...props}
    />
  );
}

/** One glass capsule holding several buttons, such as the floating bar. */
export function GlassGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav className={cx(styles.surface, styles.group)} aria-label={label}>
      {children}
    </nav>
  );
}

type GlassGroupButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * For buttons that open and close something (the panels): `true` while it is open,
   * tinted with the accent. Leave it out for plain actions.
   */
  isActive?: boolean;
};

/** A button inside a `GlassGroup`: no glass of its own, it only lights up on hover. */
export function GlassGroupButton({ isActive, type = "button", className, ...props }: GlassGroupButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles.inGroup, isActive && styles.active, className)}
      aria-pressed={isActive}
      {...props}
    />
  );
}

/** Thin divider between groups of buttons in a `GlassGroup`. */
export function GlassSeparator() {
  return <span className={styles.separator} aria-hidden="true" />;
}

type GlassSearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Accessible name; the placeholder repeats it. */
  label: string;
};

/** Glass search capsule of the header (260 × 28), such as "Buscar tableros". */
export function GlassSearchField({ label, className, ...props }: GlassSearchFieldProps) {
  return (
    <label className={cx(styles.surface, styles.search, className)}>
      <Icon name="search" />
      <input type="search" aria-label={label} placeholder={label} className={styles.searchInput} {...props} />
    </label>
  );
}
