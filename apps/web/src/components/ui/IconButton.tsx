import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";
import styles from "./IconButton.module.css";

type IconButtonProps = Omit<ComponentPropsWithRef<"button">, "children"> & {
  icon: IconName;
  /** Accessible name and tooltip: icon-only buttons always need one. */
  label: string;
};

/**
 * Small icon-only button (22 px) with a hover background: close buttons, the star and
 * "⋯" of board cards and lists. Its color comes from the surrounding text color.
 */
export function IconButton({ icon, label, className, type = "button", ...props }: IconButtonProps) {
  return (
    <button type={type} className={cx(styles.button, className)} aria-label={label} title={label} {...props}>
      <Icon name={icon} />
    </button>
  );
}
