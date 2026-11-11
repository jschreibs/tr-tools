const { test, expect } = require('@playwright/test');

test.describe('Race The Coco', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/apps/raceTheCoco/');
  });

  test('starts with Jerome and The Coco', async ({ page }) => {
    const names = page.locator('.char-name-input');
    await expect(names).toHaveCount(2);
    await expect(names.nth(0)).toHaveValue('Jerome');
    await expect(names.nth(1)).toHaveValue('The Coco');
  });

  test('adds racers up to the cap of 12, then disables Add', async ({ page }) => {
    const add = page.locator('#btn-add');
    for (let i = 0; i < 10; i++) await add.click();
    await expect(page.locator('.char-name-input')).toHaveCount(12);
    await expect(add).toBeDisabled();
  });

  test('has no leftover Randomizer or Bolt wording', async ({ page }) => {
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/bolt|usain|randomizer/i);
  });

  test('a blank name falls back to Racer N in the results', async ({ page }) => {
    test.setTimeout(120_000);
    await page.locator('#btn-add').click();
    await page.locator('.char-name-input').nth(2).fill('');
    await page.locator('#btn-start').click();
    await expect(page.locator('#race-canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#btn-race-again')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('body')).toContainText('Racer 3');
  });

  test('a race runs to the results screen and can restart', async ({ page }) => {
    test.setTimeout(120_000);
    await page.locator('#btn-start').click();
    await expect(page.locator('#countdown-display')).toBeVisible();
    await expect(page.locator('#btn-race-again')).toBeVisible({ timeout: 90_000 });
    // The winner is random, so only check that both racers are listed
    await expect(page.locator('body')).toContainText('Jerome');
    await expect(page.locator('body')).toContainText('The Coco');

    await page.locator('#btn-edit').click();
    await expect(page.locator('.char-name-input')).toHaveCount(2);
  });
});
