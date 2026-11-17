"use client";

import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import styles from "./account.module.css";

/** "Configuración": there are no options yet, like on macOS. */
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  return (
    <Modal labelledBy={titleId} onClose={onClose} width={400}>
      <ModalHeader id={titleId} title="Configuración" onClose={onClose} />
      <div className={styles.comingSoon}>
        <Icon name="gear" size={24} strokeWidth={1.3} />
        <p className={styles.comingSoonTitle}>Próximamente</p>
        <p className={styles.comingSoonText}>Aquí podrás ajustar WorkBoard a tu manera.</p>
      </div>
      <ModalFooter>
        <Button variant="primary" onClick={onClose} autoFocus>
          Hecho
        </Button>
      </ModalFooter>
    </Modal>
  );
}
