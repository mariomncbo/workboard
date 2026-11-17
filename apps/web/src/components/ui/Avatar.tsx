import { cx } from "@/lib/cx";
import { initials } from "@/lib/initials";
import styles from "./Avatar.module.css";

type AvatarSize =
  /** 22 px: account rows of the user menu. */
  | "mini"
  /** 28 px: header button and Login. */
  | "small"
  /** 44 px: user menu header and Register. */
  | "large";

/**
 * Round avatar with the user's initials (there are no profile photos yet). Neutral, so it
 * never competes with the primary action. Decorative when the name is shown next to it.
 */
export function Avatar({ fullName, size = "small", isDecorative = false }: { fullName: string; size?: AvatarSize; isDecorative?: boolean }) {
  return (
    <span
      className={cx(styles.avatar, styles[size])}
      role={isDecorative ? undefined : "img"}
      aria-label={isDecorative ? undefined : fullName}
      aria-hidden={isDecorative || undefined}
    >
      {initials(fullName)}
    </span>
  );
}
