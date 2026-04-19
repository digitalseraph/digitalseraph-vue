import { test, expect } from "@playwright/test";

test("homepage loads with hero and nav", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("nav").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("miller");
});

test("nav routes to about", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "about", exact: true }).click();
  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByRole("heading", { name: "about" })).toBeVisible();
});

test("command palette opens with ctrl+k and routes", async ({ page }) => {
  await page.goto("/");
  // Ensure the app is hydrated so the global keydown listener is bound
  await expect(page.locator("nav").first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+K");
  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
  await page.getByRole("textbox").fill("work");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work/);
});

test("theme toggle flips data-theme and persists", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: /switch to light mode/i }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("writing index lists seeded posts", async ({ page }) => {
  await page.goto("/writing");
  await expect(page.getByRole("heading", { name: "writing" })).toBeVisible();
  await expect(page.getByText("On craft and compromise")).toBeVisible();
});

test("work detail page renders", async ({ page }) => {
  await page.goto("/work/01-jump");
  await expect(page.getByRole("heading", { name: "Jump" })).toBeVisible();
});

test("writing post renders meta, prose, and nav", async ({ page }) => {
  await page.goto("/writing/2026-03-12-first-post");

  // Accent kicker
  await expect(page.getByText("$ writing/")).toBeVisible();

  // Date + reading time line
  await expect(page.getByText(/min read/)).toBeVisible();

  // Title
  await expect(
    page.getByRole("heading", { level: 1, name: /On craft/i })
  ).toBeVisible();

  // Prose container (from @tailwindcss/typography + our overrides)
  await expect(page.locator("article .prose")).toBeVisible();

  // Post nav — this is the newer of 2 seeded posts, so only "← previous" shows
  await expect(page.getByText(/← previous/)).toBeVisible();
});
