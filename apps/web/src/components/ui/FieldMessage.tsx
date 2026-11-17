import { cx } from "@/lib/cx";
import { Icon } from "./Icon";
import styles from "./FieldMessage.module.css";

export type FieldMessageValue =
  /** Neutral guidance, such as "Mínimo 8 caracteres." */
  | { kind: "help"; text: string }
  /** What went wrong and how to fix it, such as "Ese nickname ya está en uso. Prueba con otro." */
  | { kind: "error"; text: string };

/** Help or error text under a field. Errors also carry an icon, not only color. */
export function FieldMessage({ message, id }: { message: FieldMessageValue; id?: string }) {
  if (message.kind === "help") {
    return (
      <p id={id} className={styles.message}>
        {message.text}
      </p>
    );
  }
  return (
    <p id={id} className={cx(styles.message, styles.error)} role="alert">
      <Icon name="alert" size={12} />
      {message.text}
    </p>
  );
}
