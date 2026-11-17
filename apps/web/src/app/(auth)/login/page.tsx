import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    // LoginScreen reads the URL (?cambiar, ?aviso), which needs a Suspense boundary.
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}
