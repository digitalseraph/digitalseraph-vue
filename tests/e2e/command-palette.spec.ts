import { test, expect } from "@playwright/test";

test.describe("command palette", () => {
  test("opens with Ctrl+K (Cmd+K on Mac) and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const accel = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${accel}+K`);
    const palette = page.getByRole("dialog", { name: /command palette/i });
    await expect(palette).toBeVisible();
    await expect(palette.getByRole("textbox")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /command palette/i })).toHaveCount(0);
  });

  test("arrow keys change selection, Enter navigates", async ({ page }) => {
    await page.goto("/");
    const accel = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${accel}+K`);
    const palette = page.getByRole("dialog", { name: /command palette/i });
    await expect(palette).toBeVisible();

    // First option is "home" (the "/" route) by default order. ArrowDown moves to "about".
    await page.keyboard.press("ArrowDown");
    // Enter navigates to the selected option
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/about$/);
  });

  test("typing a project title filters to that project", async ({ page }) => {
    await page.goto("/");
    const accel = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${accel}+K`);
    const palette = page.getByRole("dialog", { name: /command palette/i });
    await palette.getByRole("textbox").fill("jump");
    // Jump project should be a filtered result
    await expect(palette.getByText("Jump")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/work\/01-jump$/);
  });

  test("empty query shows all entries including projects", async ({ page }) => {
    await page.goto("/");
    const accel = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${accel}+K`);
    const palette = page.getByRole("dialog", { name: /command palette/i });
    // Scroll the listbox; expect both a page and a project to be present
    await expect(palette.getByRole("option", { name: /about/i })).toBeVisible();
    await expect(palette.getByRole("option", { name: /jump/i })).toBeVisible();
  });
});
