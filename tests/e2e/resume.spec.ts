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

  test("unknown command shows 'command not found'", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForTimeout(1200);
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("foobar");
    await input.press("Enter");
    await expect(terminal(page).getByText(/command not found: foobar/)).toBeVisible();
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
});
