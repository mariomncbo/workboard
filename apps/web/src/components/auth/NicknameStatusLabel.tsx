import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import type { NicknameStatus } from "@/lib/auth/useNicknameAvailability";
import styles from "./auth.module.css";

/** Next to the "Nickname" label while typing: checking, or available. */
export function NicknameStatusLabel({ status }: { status: NicknameStatus }) {
  if (status === "checking") {
    return (
      <span className={styles.status} role="status">
        <Spinner size={11} />
        <span className="visually-hidden">Comprobando el nickname</span>
      </span>
    );
  }
  if (status === "available") {
    return (
      <span className={styles.status} role="status">
        <Icon name="checkmark" size={12} strokeWidth={2} /> Disponible
      </span>
    );
  }
  return null;
}
