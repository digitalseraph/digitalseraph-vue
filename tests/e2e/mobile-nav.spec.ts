import { test, expect } from "@playwright/test";

test.describe("mobile navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("menu trigger is visible below md breakpoint", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /open navigation menu/i })).toBeVisible();
  });

  test("tapping menu opens the drawer with nav links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const trigger = page.getByRole("button", { name: /open navigation menu/i });
    await trigger.click();
    const drawer = page.getByRole("dialog", { name: /site navigation/i });
    await expect(drawer).toBeVisible();
    // All 5 top-level routes should be reachable from the drawer
    for (const label of ["about", "work", "résumé", "writing", "contact"]) {
      await expect(drawer.getByRole("link", { name: new RegExp(label, "i") })).toBeVisible();
    }
  });

  test("Escape closes the drawer and returns focus to trigger", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const trigger = page.getByRole("button", { name: /open navigation menu/i });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("clicking the $ exit button closes the drawer", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /open navigation menu/i }).click();
    await page.getByRole("button", { name: /close navigation/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("route navigation from the drawer closes it", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /open navigation menu/i }).click();
    const drawer = page.getByRole("dialog");
    await drawer.getByRole("link", { name: /about/i }).first().click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
