import { test, expect } from "@playwright/test";

// The résumé page renders two trees simultaneously: the on-screen terminal
// (inside a role="log" region) and a hidden .print-view that duplicates the
// content for print. Most of the terminal-behaviour tests scope their
// assertions to the log region so matches aren't ambiguous with the hidden
// print tree.
const terminal = (page: import("@playwright/test").Page) =>
  page.getByRole("log", { name: /résumé terminal output/i });

test.describe("résumé terminal", () => {
  test("auto-types whoami intro on load", async ({ page }) => {
    await page.goto("/resume");
    // Give the intro time to complete (~6 chars × 45ms ≈ 270ms + breath 150ms)
    await page.waitForTimeout(1200);
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
  });

  test("sidebar click runs cat experience.md and renders all roles", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForTimeout(1200);
    await page
      .locator("nav button")
      .filter({ hasText: "cat experience.md" })
      .first()
      .click();
    await expect(terminal(page).getByText(/Cox Communications/).first()).toBeVisible();
    await expect(
      terminal(page).getByText(/Professional Photographic Resources/).first(),
    ).toBeVisible();
  });

  test("typing a command + Enter appends a buffer entry", async ({ page }) => {
    await page.goto("/resume");
    // Wait for the intro whoami to finish so typeInto has released the input
    // (fixed waits flake on slower CI hardware).
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("contact");
    await input.press("Enter");
    await expect(terminal(page).getByText("hello@digitalseraph.com").first()).toBeVisible();
  });

  test("unknown command shows bash-style 'command not found'", async ({ page }) => {
    await page.goto("/resume");
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("foobar");
    await input.press("Enter");
    await expect(terminal(page).getByText(/bash: foobar: command not found/)).toBeVisible();
  });

  test("clear empties the buffer", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForTimeout(1200);
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    // The intro whoami entry is in the buffer
    await expect(terminal(page).getByText(/David Miller/).first()).toBeVisible();
    await input.fill("clear");
    await input.press("Enter");
    await page.waitForTimeout(100);
    await expect(terminal(page).getByText(/David Miller/)).toHaveCount(0);
  });

  test("print view is the only visible content under print media", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForTimeout(1200);
    await page.emulateMedia({ media: "print" });
    // Nav should be hidden
    await expect(page.locator("nav").first()).toBeHidden();
    // Print view h1 visible
    await expect(page.locator(".print-view h1")).toContainText("David Miller");
  });

  test("reduced motion collapses typing instantly", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/resume");
    // No 1200ms wait — intro should be instant
    await page.waitForTimeout(400);
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
  });

  test("ls projects/ lists all project slugs", async ({ page }) => {
    await page.goto("/resume");
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("ls projects/");
    await input.press("Enter");
    for (const slug of ["01-jump", "02-thrivee", "03-gofan", "04-trpz", "05-editorial"]) {
      await expect(terminal(page).getByText(new RegExp(`${slug}\\.md`))).toBeVisible();
    }
  });

  test("grep Vue returns at least one highlighted match", async ({ page }) => {
    await page.goto("/resume");
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("grep Vue");
    await input.press("Enter");
    await expect(terminal(page).locator("mark").first()).toBeVisible();
  });

  test("theme light flips <html> data-theme and persists through a reload", async ({ page }) => {
    await page.goto("/resume");
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("theme light");
    await input.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    // Reset so later tests don't inherit light mode
    const input2 = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input2.fill("theme dark");
    await input2.press("Enter");
  });

  test("ArrowUp recalls the most recent command", async ({ page }) => {
    await page.goto("/resume");
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("contact");
    await input.press("Enter");
    await expect(terminal(page).getByText("hello@digitalseraph.com").first()).toBeVisible();
    await input.press("ArrowUp");
    await expect(input).toHaveValue("contact");
  });
});
