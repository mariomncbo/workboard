"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import styles from "./error.module.css";

/** Shown when the boards could not be loaded (no connection, server error). */
export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <main className={styles.page}>
      <Icon name="alert" size={28} strokeWidth={1.2} />
      <h1 className={styles.title}>No se han podido cargar tus tableros</h1>
      <p className={styles.text}>Comprueba tu conexión y vuelve a probar.</p>
      <Button onClick={retry}>Reintentar</Button>
    </main>
  );
}
