import { test, expect } from "@playwright/test";

/**
 * Smoke tests — run against a preview build.
 * In CI, the Riot API should be mocked or use stubs.
 */

test.describe("Smurfessor — Smoke", () => {
  test("dashboard shows 18 account cards", async ({ page }) => {
    await page.goto("/");

    // Each account card is an <a> link to /game/[key]
    const cards = page.locator('a[href^="/game/"]');
    await expect(cards).toHaveCount(18);
  });

  test("dashboard has page title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Cuentas rastreadas");
  });

  test("clicking a card navigates to game page", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/game/zhyak-v2"]').click();
    await expect(page).toHaveURL(/\/game\/zhyak-v2/);
  });

  test("game page has back link", async ({ page }) => {
    await page.goto("/game/zhyak-v2");
    const backLink = page.locator('a[href="/"]');
    await expect(backLink).toBeVisible();
  });
});

test.describe("Smurfessor — Smurf Detection E2E", () => {
  test("smurf-test card exists on dashboard", async ({ page }) => {
    await page.goto("/");
    const smurfCard = page.locator('a[href="/game/smurf-test"]');
    await expect(smurfCard).toBeVisible();
  });

  test("smurf-test game renders 10 PlayerCards with smurf badges", async ({ page }) => {
    await page.goto("/game/smurf-test");

    // Wait for batch fetch to complete — cards should appear
    await page.waitForSelector('[data-smurf-severity]', { timeout: 15000 });

    // 10 PlayerCards total
    const cards = page.locator('[data-smurf-severity]');
    await expect(cards).toHaveCount(10);

    // Confirmed smurfs (blue 2 + red 1 = 3 total)
    const confirmed = page.locator('[data-smurf-severity="confirmed"]');
    await expect(confirmed).toHaveCount(3);

    // Possible smurfs (blue 1 + red 2 = 3 total)
    const possible = page.locator('[data-smurf-severity="possible"]');
    await expect(possible).toHaveCount(3);

    // None (blue 2 + red 2 = 4 total)
    const none = page.locator('[data-smurf-severity="none"]');
    await expect(none).toHaveCount(4);
  });

  test("blue team smurf counter shows 2 confirmed + 1 possible", async ({ page }) => {
    await page.goto("/game/smurf-test");
    await page.waitForSelector('[data-smurf-severity]', { timeout: 15000 });

    const blueCounter = page.locator('[data-testid="blue-smurf-counter"]');
    await expect(blueCounter.locator("text=Smurfs: 2")).toBeVisible();
    await expect(blueCounter.locator("text=Posibles: 1")).toBeVisible();
  });

  test("red team smurf counter shows 1 confirmed + 2 possible", async ({ page }) => {
    await page.goto("/game/smurf-test");
    await page.waitForSelector('[data-smurf-severity]', { timeout: 15000 });

    const redCounter = page.locator('[data-testid="red-smurf-counter"]');
    await expect(redCounter.locator("text=Smurfs: 1")).toBeVisible();
    await expect(redCounter.locator("text=Posibles: 2")).toBeVisible();
  });
});
