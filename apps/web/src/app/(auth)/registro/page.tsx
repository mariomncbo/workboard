import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Crear una cuenta",
};

/** Sign-up. The form comes with the authentication step. */
export default function RegisterPage() {
  return (
    <>
      <Logo height={50} />
      <p>Crea tu cuenta. Tu espacio de trabajo estará listo en un momento.</p>
      <p>
        ¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link>
      </p>
    </>
  );
}
