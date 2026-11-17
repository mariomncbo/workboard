import type { Metadata } from "next";
import { NewPasswordScreen } from "@/components/auth/NewPasswordScreen";

export const metadata: Metadata = {
  title: "Nueva contraseña",
};

export default function NewPasswordPage() {
  return <NewPasswordScreen />;
}
