import { addTasks, boardState, createAndOpenBoard, createList, expect, test } from "./fixtures";

test.describe("Tablero", () => {
  test.beforeEach(async ({ appPage: page }) => {
    await createAndOpenBoard(page, "Lanzamiento v2");
    await expect(page.getByText("Este tablero aún no tiene listas")).toBeVisible();
    await createList(page, "Por hacer");
    await createList(page, "Hecho");
    await addTasks(page, "Por hacer", ["Revisar el registro", "Escribir el README"]);
  });

  test("editar una tarea en su modal", async ({ appPage: page }) => {
    await page.getByRole("button", { name: "Revisar el registro", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("En la lista")).toContainText("Por hacer");
    await dialog.getByLabel("Descripción").fill("Correo o nickname y cuentas recientes.");
    await dialog.getByRole("radio", { name: "Ámbar" }).check({ force: true });
    await dialog.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("button", { name: "Revisar el registro, Ámbar" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Revisar el registro, Ámbar" })).toBeVisible();
  });

  test("mover una tarea a otra lista con el teclado, y deshacerlo", async ({ appPage: page }) => {
    // Like a screen reader user: each key waits for its announcement.
    const announcements = page.locator("[id^=DndLiveRegion]");
    await page.getByRole("button", { name: "Revisar el registro", exact: true }).focus();
    await page.keyboard.press("Space");
    // Picked up and measured: still in its place.
    await expect(announcements).toHaveText("«Revisar el registro» está en la posición 1 de 2 de la lista «Por hacer».");
    // dnd-kit starts listening to the keys and measures the lists a moment after the pick-up;
    // a person is never that fast, the test is. "Hecho" is the last list, so extra presses do nothing.
    await expect(async () => {
      await page.keyboard.press("ArrowRight");
      await expect(announcements).toHaveText("«Revisar el registro» está en la posición 1 de 1 de la lista «Hecho».", {
        timeout: 1000,
      });
    }).toPass();
    await page.keyboard.press("Space");
    await expect(announcements).toHaveText("Has soltado «Revisar el registro» en la lista «Hecho».");
    await expect.poll(() => boardState(page)).toEqual({
      "Por hacer": ["Escribir el README"],
      Hecho: ["Revisar el registro"],
    });

    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(() => boardState(page)).toEqual({
      "Por hacer": ["Revisar el registro", "Escribir el README"],
      Hecho: [],
    });
  });

  test("arrastrar una tarea con el ratón a una lista vacía, y guardarlo", async ({ appPage: page }) => {
    const task = page.getByRole("button", { name: "Escribir el README", exact: true });
    const target = page.getByRole("region", { name: "Hecho" });
    const from = (await task.boundingBox())!;
    const to = (await target.boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, { steps: 3 });
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 });
    await page.mouse.up();
    await expect.poll(() => boardState(page)).toEqual({ "Por hacer": ["Revisar el registro"], Hecho: ["Escribir el README"] });

    await expect.poll(async () => {
      await page.reload();
      return boardState(page);
    }).toEqual({ "Por hacer": ["Revisar el registro"], Hecho: ["Escribir el README"] });
  });

  test("renombrar y eliminar una lista con su menú, y deshacer el borrado", async ({ appPage: page }) => {
    await page.getByRole("region", { name: "Hecho" }).getByRole("button", { name: "Opciones de la lista" }).click();
    await page.getByRole("menuitem", { name: "Renombrar" }).click();
    const nameField = page.getByRole("textbox", { name: "Nombre de la lista" });
    await nameField.fill("Terminado");
    await nameField.press("Enter");
    await expect(page.getByRole("region", { name: "Terminado" })).toBeVisible();

    await page.getByRole("region", { name: "Por hacer" }).getByRole("button", { name: "Opciones de la lista" }).click();
    await page.getByRole("menuitem", { name: "Eliminar lista…" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Se borrarán la lista y sus 2 tareas.");
    await dialog.getByRole("button", { name: "Eliminar lista" }).click();
    await expect(page.getByRole("region", { name: "Por hacer" })).toHaveCount(0);

    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(() => boardState(page)).toEqual({
      "Por hacer": ["Revisar el registro", "Escribir el README"],
      Terminado: [],
    });
  });

  test("Notas y Planificador: solo un panel abierto a la vez", async ({ appPage: page }) => {
    const bar = page.getByRole("navigation", { name: "Herramientas del tablero" });
    await bar.getByRole("button", { name: "Notas" }).click();
    await expect(page.getByRole("complementary", { name: "Notas" })).toBeVisible();
    await bar.getByRole("button", { name: "Planificador" }).click();
    await expect(page.getByRole("complementary", { name: "Planificador" })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Notas" })).toHaveCount(0);
    await bar.getByRole("button", { name: "Planificador" }).click();
    await expect(page.getByRole("complementary")).toHaveCount(0);
  });
});
