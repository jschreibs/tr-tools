const { test, expect } = require('@playwright/test');

test.describe('Hub', () => {
  test('opens on Planner and switches folders by click', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tab', { name: 'Planner' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-race-the-coco')).toBeHidden();

    await page.getByRole('tab', { name: 'Race The Coco' }).click();
    await expect(page.getByRole('tab', { name: 'Race The Coco' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-race-the-coco')).toBeVisible();
    await expect(page.locator('#panel-planner')).toBeHidden();
    await expect(page).toHaveURL(/#race-the-coco$/);
  });

  test('arrow keys move between tabs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Planner' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Race The Coco' })).toBeFocused();
    await expect(page.locator('#panel-race-the-coco')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Planner' })).toBeFocused();
  });

  test('deep link #race-the-coco opens that folder', async ({ page }) => {
    await page.goto('/#race-the-coco');
    await expect(page.locator('#panel-race-the-coco')).toBeVisible();
    await expect(page.getByText('Randomizer tool where you race against your coworkers and The Coco.')).toBeVisible();
  });

  test('Open links reach each app', async ({ page }) => {
    await page.goto('/');
    await page.locator('#panel-planner .stamp').click();
    await expect(page).toHaveURL(/apps\/planner\//);
    await expect(page.getByRole('heading', { name: 'Planner', level: 1 })).toBeVisible();

    await page.goto('/#race-the-coco');
    await page.locator('#panel-race-the-coco .stamp').click();
    await expect(page).toHaveURL(/apps\/raceTheCoco\//);
    await expect(page.getByRole('heading', { name: 'Race The Coco', level: 1 })).toBeVisible();
  });

  test('has no horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
