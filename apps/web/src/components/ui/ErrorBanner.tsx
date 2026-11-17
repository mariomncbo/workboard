import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import styles from "./ErrorBanner.module.css";

/** Small floating notice for a change that could not be saved, with a close button. */
export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className={styles.banner} role="alert">
      <Icon name="alert" className={styles.icon} />
      <p className={styles.text}>{message}</p>
      <IconButton icon="xmark" label="Cerrar aviso" onClick={onDismiss} />
    </div>
  );
}
