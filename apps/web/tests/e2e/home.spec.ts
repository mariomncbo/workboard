import { expect, test } from "./fixtures";

test.describe("Inicio", () => {
  test("crear tableros, favoritos primero y buscar", async ({ appPage: page }) => {
    await expect(page.getByText("Crea tu primer tablero")).toBeVisible();
    for (const name of ["Marketing Q1", "Investigación"]) {
      await page.getByRole("button", { name: "Crear", exact: true }).click();
      await page.getByRole("dialog").getByLabel("Nombre").fill(name);
      await page.getByRole("dialog").getByRole("button", { name: "Crear tablero" }).click();
      await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
    }
    const boards = page.getByRole("list", { name: "Tableros" }).getByRole("link");
    await expect(boards).toHaveText([/Investigación/, /Marketing Q1/]);

    const marketing = page.getByRole("listitem").filter({ hasText: "Marketing Q1" });
    await marketing.hover();
    await marketing.getByRole("button", { name: "Añadir a favoritos" }).click();
    await expect(boards).toHaveText([/Marketing Q1/, /Investigación/]);

    await page.getByRole("searchbox", { name: "Buscar tableros" }).fill("investigacion");
    await expect(boards).toHaveText([/Investigación/]);
    await page.getByRole("searchbox", { name: "Buscar tableros" }).fill("zzz");
    await expect(page.getByText("Sin resultados para «zzz»")).toBeVisible();
  });

  test("eliminar un tablero y deshacerlo con ⌘Z", async ({ appPage: page }) => {
    await page.getByRole("button", { name: "Crear", exact: true }).click();
    await page.getByRole("dialog").getByLabel("Nombre").fill("Viaje de equipo");
    await page.getByRole("dialog").getByRole("button", { name: "Crear tablero" }).click();

    await page.getByRole("link", { name: /Viaje de equipo/ }).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Eliminar tablero…" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Eliminar tablero" }).click();
    await expect(page.getByText("Crea tu primer tablero")).toBeVisible();

    await page.keyboard.press("ControlOrMeta+z");
    await expect(page.getByRole("link", { name: /Viaje de equipo/ })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Deshecho: Eliminar tablero" })).toBeAttached();
    // Saved: it is still there after reloading.
    await expect.poll(async () => {
      await page.reload();
      return page.getByRole("link", { name: /Viaje de equipo/ }).count();
    }).toBe(1);
  });
});
