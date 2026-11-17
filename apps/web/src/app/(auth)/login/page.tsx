import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

/** Sign-in. The form comes with the authentication step. */
export default function LoginPage() {
  return (
    <>
      <Logo height={50} />
      <p>Inicia sesión para ver tus tableros.</p>
      <p>
        ¿No tienes cuenta? <Link href="/registro">Crear una cuenta</Link>
      </p>
    </>
  );
}
