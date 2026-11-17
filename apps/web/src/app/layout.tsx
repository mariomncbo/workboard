import type { Metadata, Viewport } from "next";
import "@/styles/tokens.css";
import "./globals.css";
import { siteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "WorkBoard",
    template: "%s · WorkBoard",
  },
  description:
    "WorkBoard es una aplicación de gestión de proyectos basada en tableros, listas y tareas, para macOS y la web.",
  applicationName: "WorkBoard",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0a0b0d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
