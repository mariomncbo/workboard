import { expect, newAccountData, signIn, test } from "./fixtures";

test.describe("Autenticación", () => {
  test("sin sesión, la app lleva al login", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("registro con el nickname comprobado en vivo", async ({ page, accounts }) => {
    const account = newAccountData("Lucía Ortega");
    accounts.track(account);
    await page.goto("/registro");
    await page.getByLabel("Nombre y apellidos").fill(account.fullName);
    await expect(page.getByText("Tu avatar son tus iniciales")).toBeVisible();
    await page.getByLabel("Correo").fill(account.email);
    await page.getByLabel("Nickname").fill(account.nickname);
    await expect(page.getByText("Disponible")).toBeVisible();
    await page.getByLabel("Contraseña", { exact: true }).fill(account.password);
    await page.getByLabel("Confirmar contraseña").fill(account.password);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("heading", { name: "Mi espacio de trabajo" })).toBeVisible();
    await expect(page.getByRole("button", { name: `Cuenta de ${account.fullName}` })).toHaveText("LO");
  });

  test("un nickname ocupado se avisa antes de enviar", async ({ page, accounts }) => {
    const existing = await accounts.create();
    await page.goto("/registro");
    await page.getByLabel("Nickname").fill(existing.nickname);
    await expect(page.getByText("Ese nickname ya está en uso. Prueba con otro.")).toBeVisible();
  });

  test("login con nickname, y error con una contraseña incorrecta", async ({ page, accounts }) => {
    const account = await accounts.create();
    await page.goto("/login");
    await page.getByLabel("Correo o nickname").fill(`@${account.nickname}`);
    await page.getByLabel("Contraseña", { exact: true }).fill("contraseña-incorrecta");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByText("Correo, nickname o contraseña incorrectos.")).toBeVisible();

    await page.getByLabel("Contraseña", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByRole("heading", { name: "Mi espacio de trabajo" })).toBeVisible();
  });

  test("cuentas recientes: cambiar de cuenta entra sin contraseña y cerrar sesión la pide", async ({ page, accounts }) => {
    const first = await accounts.create("Primera Cuenta");
    const second = await accounts.create("Segunda Cuenta");
    await signIn(page, first.email, first.password);

    // Switch to the second account from the user menu.
    await page.getByRole("button", { name: "Cuenta de Primera Cuenta" }).click();
    await page.getByRole("button", { name: "Entrar con otra cuenta…" }).click();
    await expect(page.getByText("Sesión actual")).toBeVisible();
    await page.getByLabel("Correo o nickname").fill(second.email);
    await page.getByLabel("Contraseña", { exact: true }).fill(second.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByRole("button", { name: "Cuenta de Segunda Cuenta" })).toBeVisible();

    // Back to the first one, without a password.
    await page.getByRole("button", { name: "Cuenta de Segunda Cuenta" }).click();
    await page.getByRole("button", { name: /Primera Cuenta/ }).click();
    await expect(page.getByRole("button", { name: "Cuenta de Primera Cuenta" })).toBeVisible();

    // Signing out keeps the account, but it asks for the password.
    await page.getByRole("button", { name: "Cuenta de Primera Cuenta" }).click();
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: /Entrar como Primera Cuenta, .* Pide contraseña/ })).toBeVisible();
  });

  test("eliminar la cuenta pide escribir el nickname", async ({ page, accounts }) => {
    const signedIn = await accounts.create();
    await signIn(page, signedIn.email, signedIn.password);
    await page.getByRole("button", { name: `Cuenta de ${signedIn.fullName}` }).click();
    await page.getByRole("button", { name: "Eliminar cuenta…" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Eliminar tu cuenta?" });
    const confirm = dialog.getByRole("button", { name: "Eliminar cuenta" });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel(`Escribe ${signedIn.nickname} para confirmar`).fill(signedIn.nickname);
    await confirm.click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
