import { writeFileSync, mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { DEMO_PROFILE, MAIN_BOARD, demoCredentials, resetDemoContent } from "./demoContent";

/*
 * Screenshots and video of the landing, made from the web app with the demo account.
 * Run with `npm run landing:media` (it also encodes the video with ffmpeg).
 */

const OUT = "public/landing";
const RAW = "test-results/landing-media/raw";
const SCREENSHOT_SIZE = { width: 1280, height: 720 };
const VIDEO_SIZE = { width: 1280, height: 720 };

test.describe.configure({ mode: "serial" });

/** The dev server's indicator (the "N" at the bottom left) is not part of the app. */
const HIDE_DEV_INDICATOR = `
  addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = "nextjs-portal { display: none !important; }";
    document.head.appendChild(style);
  });
`;

/** Takes the pointer out of the page, so the dot grid shows no highlight. */
async function pointerAway(page: Page) {
  await page.mouse.move(2, 2);
  await page.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent("pointerleave")));
  await page.waitForTimeout(700);
}

/** Headless browsers draw no pointer: a macOS-like arrow follows the mouse in the video. */
const FAKE_CURSOR = `
  addEventListener("DOMContentLoaded", () => {
    const cursor = document.createElement("div");
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2l14 9.5-6.2 1.2-3.3 6.3z" fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/></svg>';
    Object.assign(cursor.style, { position: "fixed", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none", transform: "translate(-100px, -100px)", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.5))" });
    document.body.appendChild(cursor);
    addEventListener("pointermove", (e) => { cursor.style.transform = "translate(" + (e.clientX - 3) + "px," + (e.clientY - 2) + "px)"; }, true);
  });
`;

async function signIn(page: Page) {
  const { email, password } = demoCredentials();
  await page.goto("/login");
  await page.getByLabel("Correo o nickname").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Mi espacio de trabajo" })).toBeVisible();
}

/** Moves the pointer in small steps, like a person. */
async function glide(page: Page, x: number, y: number, steps = 25) {
  await page.mouse.move(x, y, { steps });
}

async function center(page: Page, locator: ReturnType<Page["locator"]>) {
  const box = (await locator.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

let storageState: Awaited<ReturnType<ReturnType<Page["context"]>["storageState"]>>;

test("capturas de la web", async ({ browser }) => {
  await resetDemoContent();
  mkdirSync(OUT, { recursive: true });
  const context = await browser.newContext({ viewport: SCREENSHOT_SIZE, deviceScaleFactor: 2 });
  await context.addInitScript(HIDE_DEV_INDICATOR);
  const page = await context.newPage();
  await signIn(page);
  storageState = await context.storageState();

  // Home, with the favorites first and the star of a card under the pointer.
  await page.waitForTimeout(1500);
  const marketing = page.getByRole("listitem").filter({ hasText: "Marketing Q1" });
  await marketing.hover();
  await page.waitForTimeout(300);
  // Only the part with boards: the rest of Home is empty background.
  await page.screenshot({ path: `${OUT}/inicio.png`, clip: { x: 0, y: 0, width: SCREENSHOT_SIZE.width, height: 480 } });

  // Delete confirmation.
  await marketing.getByRole("link").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Eliminar tablero…" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/borrar.png` });
  await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();

  // The board.
  await page.getByRole("link", { name: new RegExp(MAIN_BOARD) }).click();
  await expect(page.getByRole("heading", { level: 1, name: MAIN_BOARD })).toBeVisible();
  await pointerAway(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/tablero.png` });

  // A task halfway through a drag.
  const task = page.getByRole("button", { name: "Pantalla de Login", exact: true });
  const from = await center(page, task);
  const to = await center(page, page.getByRole("region", { name: "Revisión" }));
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await glide(page, from.x + 12, from.y + 8, 4);
  await glide(page, to.x - 20, to.y + 30, 20);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/arrastrar.png` });
  await page.keyboard.press("Escape");
  await page.mouse.up();

  // The web: Login with the recent accounts of this browser.
  await page.goto("/login?cambiar");
  await expect(page.getByText("Sesión actual")).toBeVisible();
  await pointerAway(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/web.png` });
  await context.close();
});

test("vídeo de la portada", async ({ browser }) => {
  await resetDemoContent();
  mkdirSync(RAW, { recursive: true });
  const context = await browser.newContext({
    viewport: VIDEO_SIZE,
    storageState,
    recordVideo: { dir: RAW, size: VIDEO_SIZE },
  });
  await context.addInitScript(FAKE_CURSOR);
  await context.addInitScript(HIDE_DEV_INDICATOR);
  const startedAt = Date.now();
  const page = await context.newPage();

  // Open the board directly (Home is not part of the clip).
  await page.goto("/app");
  await page.getByRole("link", { name: new RegExp(MAIN_BOARD) }).click();
  await expect(page.getByRole("heading", { level: 1, name: MAIN_BOARD })).toBeVisible();
  await page.mouse.move(VIDEO_SIZE.width / 2, VIDEO_SIZE.height - 140);
  await page.waitForTimeout(1500);
  const clipStart = (Date.now() - startedAt) / 1000;

  // 1. Add a task.
  const todo = page.getByRole("region", { name: "Por hacer" });
  const addButton = todo.getByRole("button", { name: "Añade una tarea" });
  const add = await center(page, todo);
  await glide(page, add.x, add.y + 40, 30);
  await page.waitForTimeout(250);
  const addCenter = await center(page, addButton);
  await glide(page, addCenter.x - 40, addCenter.y, 15);
  await page.mouse.down();
  await page.mouse.up();
  const field = todo.getByRole("textbox", { name: "Nombre de la nueva tarea en Por hacer" });
  await field.pressSequentially("Grabar el vídeo de la portada", { delay: 55 });
  await page.waitForTimeout(300);
  await field.press("Enter");
  await page.waitForTimeout(500);
  await field.press("Escape");
  await page.waitForTimeout(700);

  // 2. Drag it to "Revisión".
  const newTask = page.getByRole("button", { name: "Grabar el vídeo de la portada", exact: true });
  const from = await center(page, newTask);
  await glide(page, from.x, from.y, 20);
  await page.waitForTimeout(250);
  await page.mouse.down();
  await glide(page, from.x + 14, from.y + 6, 5);
  const review = await center(page, page.getByRole("region", { name: "Revisión" }));
  await glide(page, review.x, review.y + 10, 45);
  await page.waitForTimeout(350);
  await page.mouse.up();
  await page.waitForTimeout(900);

  // 3. Give it a color from its context menu.
  const moved = await center(page, newTask);
  await glide(page, moved.x, moved.y, 15);
  await page.mouse.click(moved.x, moved.y, { button: "right" });
  await page.waitForTimeout(600);
  const violet = await center(page, page.getByRole("menuitemradio", { name: "Violeta" }));
  await glide(page, violet.x, violet.y, 15);
  await page.waitForTimeout(250);
  await page.mouse.click(violet.x, violet.y);
  await page.waitForTimeout(1100);

  // 4. Undo the color and the move with ⌘Z.
  await glide(page, VIDEO_SIZE.width / 2, VIDEO_SIZE.height - 160, 20);
  await page.keyboard.press("ControlOrMeta+z");
  await page.waitForTimeout(1000);
  await page.keyboard.press("ControlOrMeta+z");
  await page.waitForTimeout(1600);
  const clipEnd = (Date.now() - startedAt) / 1000;

  const video = page.video()!;
  await context.close();
  await video.saveAs(`${RAW}/hero-raw.webm`);
  // process.sh trims to this segment.
  writeFileSync(`${RAW}/clip.json`, JSON.stringify({ start: clipStart, end: clipEnd, profile: DEMO_PROFILE.fullName }));
});

test("imagen para redes", async ({ browser }) => {
  // The landing hero as it opens: the particle symbol and the headline (1200 × 630).
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await context.addInitScript(HIDE_DEV_INDICATOR);
  const page = await context.newPage();
  await page.goto("/");
  await pointerAway(page);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/og.jpg`, type: "jpeg", quality: 85 });
  await context.close();
});
