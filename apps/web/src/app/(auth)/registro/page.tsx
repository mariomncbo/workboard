import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterScreen } from "@/components/auth/RegisterScreen";

export const metadata: Metadata = {
  title: "Crear una cuenta",
};

export default function RegisterPage() {
  return (
    // RegisterScreen reads the URL (?cambiar), which needs a Suspense boundary.
    <Suspense>
      <RegisterScreen />
    </Suspense>
  );
}
