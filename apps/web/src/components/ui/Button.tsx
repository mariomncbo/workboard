import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Spinner } from "./Spinner";
import styles from "./Button.module.css";

type ButtonVariant =
  /** The single main action of a view ("Crear", "Guardar"). */
  | "primary"
  /** "Cancelar" and other secondary actions. */
  | "secondary"
  /** Options inside panels and "Eliminar…" items. */
  | "plain"
  /** Only inside a deletion confirmation. Never the default action. */
  | "danger";

type ButtonSize =
  /** 24 px, compact Mac size: modals and panels. */
  | "compact"
  /** 30 px and full width: the main button of the sign-in forms. */
  | "block";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner in place of the label and disables the button. */
  isLoading?: boolean;
};

/** Content button of the design system. Glass buttons live in `GlassButton`. */
export function Button({
  variant = "secondary",
  size = "compact",
  isLoading = false,
  type = "button",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], styles[size], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      <span className={cx(styles.label, isLoading && styles.hidden)}>{children}</span>
      {isLoading && (
        <span className={styles.spinner}>
          <Spinner size={13} />
        </span>
      )}
    </button>
  );
}
