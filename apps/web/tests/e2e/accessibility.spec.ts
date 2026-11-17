import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { addTasks, createAndOpenBoard, createList, expect, test } from "./fixtures";

/** Serious and critical WCAG 2.2 AA problems found by axe. */
async function seriousViolations(page: Page) {
  // Analyze the final colors, not halfway through an entrance animation (modals fade in).
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => `${node.target.join(" ")} (${node.failureSummary?.replace(/\s+/g, " ")})`).join(", ")}`,
    );
}

test.describe("Accesibilidad (axe)", () => {
  test("login y registro", async ({ page }) => {
    await page.goto("/login");
    expect(await seriousViolations(page)).toEqual([]);
    await page.goto("/registro");
    expect(await seriousViolations(page)).toEqual([]);
  });

  test("Inicio, tablero y modales", async ({ appPage: page }) => {
    expect(await seriousViolations(page)).toEqual([]);
    await createAndOpenBoard(page, "Accesibilidad");
    await createList(page, "Por hacer");
    await addTasks(page, "Por hacer", ["Una tarea"]);
    expect(await seriousViolations(page)).toEqual([]);

    await page.getByRole("button", { name: "Una tarea", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });
});
