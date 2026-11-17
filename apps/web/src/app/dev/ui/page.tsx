import { notFound } from "next/navigation";
import { ComponentGallery } from "./ComponentGallery";

export const metadata = { title: "Componentes" };

/** Gallery of the design system components. Only available in development. */
export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <ComponentGallery />;
}
