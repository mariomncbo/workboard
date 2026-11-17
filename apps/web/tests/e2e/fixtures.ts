import { test as base, expect, type BrowserContextOptions, type Page } from "@playwright/test";
import { createClient, type Session } from "@supabase/supabase-js";

export type TestAccount = { fullName: string; email: string; nickname: string; password: string };

/** An account created through the API, with its session (used to clean up and delete it). */
type CreatedAccount = TestAccount & { session: Session | null };

/*
 * Supabase Auth limits sign-ups and sign-ins per IP. To stay well below it, the tests of
 * Home and boards share one account per run (signed in once, data wiped between tests),
 * and accounts are deleted with the session they already have.
 */

function supabase(accessToken?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (.env.local).");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}

/** Unique data for a temporary account. */
export function newAccountData(fullName = "Prueba E2E"): TestAccount {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return { fullName, email: `workboard.test.e2e.${id}@gmail.com`, nickname: `e2e_${id}`, password: "Prueba-1234-segura" };
}

async function createAccount(fullName?: string): Promise<CreatedAccount> {
  const account = newAccountData(fullName);
  const { data, error } = await supabase().auth.signUp({
    email: account.email,
    password: account.password,
    options: { data: { full_name: account.fullName, nickname: account.nickname } },
  });
  if (error) throw error;
  return { ...account, session: data.session };
}

/** Deletes a temporary account and all its data, if it still exists. */
async function deleteAccount(account: CreatedAccount) {
  let accessToken = account.session?.access_token;
  if (!accessToken) {
    // Created through the interface: sign in once to delete it.
    const { data } = await supabase().auth.signInWithPassword({ email: account.email, password: account.password });
    accessToken = data.session?.access_token;
  }
  if (!accessToken) return; // Already deleted by the test.
  await supabase(accessToken).functions.invoke("delete-account", { method: "POST" });
}

type TestFixtures = {
  /** Creates temporary accounts and deletes them after the test. */
  accounts: { create: (fullName?: string) => Promise<TestAccount>; track: (account: TestAccount) => void };
  /** A page signed in with the shared account, without boards, on Home. */
  appPage: Page;
};

type WorkerFixtures = {
  /** One account for the whole run, with the browser state of its signed-in session. */
  sharedAccount: { account: CreatedAccount; storageState: BrowserContextOptions["storageState"] };
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  sharedAccount: [
    async ({ browser }, provide) => {
      const account = await createAccount("Prueba E2E");
      const page = await browser.newPage({ baseURL: "http://localhost:3000" });
      await signIn(page, account.email, account.password);
      const storageState = await page.context().storageState();
      await page.close();
      await provide({ account, storageState });
      await deleteAccount(account);
    },
    { scope: "worker" },
  ],

  accounts: async ({}, provide) => {
    const created: CreatedAccount[] = [];
    await provide({
      async create(fullName) {
        const account = await createAccount(fullName);
        created.push(account);
        return account;
      },
      track: (account) => created.push({ ...account, session: null }),
    });
    for (const account of created) await deleteAccount(account);
  },

  appPage: async ({ browser, sharedAccount }, provide, testInfo) => {
    // Start every test without boards (lists and tasks go with them).
    const { account, storageState } = sharedAccount;
    const { error } = await supabase(account.session?.access_token).from("boards").delete().not("id", "is", null);
    if (error) throw error;

    const context = await browser.newContext({ ...testInfo.project.use, storageState });
    const page = await context.newPage();
    await page.goto("/app");
    await expect(page.getByRole("heading", { name: "Mi espacio de trabajo" })).toBeVisible();
    await provide(page);
    await context.close();
  },
});

export async function signIn(page: Page, identifier: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo o nickname").fill(identifier);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Mi espacio de trabajo" })).toBeVisible();
}

/** Creates a board from Home and opens it. */
export async function createAndOpenBoard(page: Page, name: string) {
  await page.getByRole("button", { name: "Crear", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Nombre").fill(name);
  await page.getByRole("dialog").getByRole("button", { name: "Crear tablero" }).click();
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

/** Creates a list from the floating bar. */
export async function createList(page: Page, name: string) {
  await page.getByRole("navigation", { name: "Herramientas del tablero" }).getByRole("button", { name: "Añade una lista" }).click();
  await page.getByRole("dialog").getByLabel("Nombre").fill(name);
  await page.getByRole("dialog").getByRole("button", { name: "Crear lista" }).click();
  await expect(page.getByRole("region", { name })).toBeVisible();
}

/** Adds tasks to a list with "Añade una tarea". */
export async function addTasks(page: Page, listName: string, names: string[]) {
  const list = page.getByRole("region", { name: listName });
  await list.hover();
  await list.getByRole("button", { name: "Añade una tarea" }).click();
  const field = list.getByRole("textbox", { name: `Nombre de la nueva tarea en ${listName}` });
  for (const name of names) {
    await field.fill(name);
    await field.press("Enter");
    await expect(list.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await field.press("Escape");
}

/** Task names of each list, in order. */
export async function boardState(page: Page) {
  return page.getByRole("region").evaluateAll((lists) =>
    Object.fromEntries(
      lists.map((list) => [
        list.getAttribute("aria-label"),
        [...list.querySelectorAll('[aria-roledescription="tarea"]')].map((task) => task.textContent),
      ]),
    ),
  );
}

export { expect };
