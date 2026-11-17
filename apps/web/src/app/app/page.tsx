import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi espacio de trabajo",
};

/**
 * Signed-in area. The proxy only lets signed-in users in; Home is built in a later step.
 */
export default function WorkspacePage() {
  return (
    <main>
      <h1>Mi espacio de trabajo</h1>
    </main>
  );
}
