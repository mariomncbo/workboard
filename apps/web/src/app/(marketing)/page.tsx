import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import styles from "./page.module.css";

/**
 * Temporary landing page. The real landing is designed and built at the end of the web
 * version, with screenshots of the finished product.
 */
export default function LandingPage() {
  return (
    <main className={styles.page}>
      <Logo height={50} />
      <p className={styles.tagline}>Organiza tu trabajo en tableros, listas y tareas.</p>
      <div className={styles.actions}>
        <Link className={styles.primary} href="/login">
          Iniciar sesión
        </Link>
        <Link className={styles.secondary} href="/registro">
          Crear una cuenta
        </Link>
      </div>
    </main>
  );
}
