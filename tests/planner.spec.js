const { test, expect } = require('@playwright/test');

// Fixed clock: June 2026 (Juneteenth is Friday the 19th). No dependence on today's date.
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-06-10T12:00:00') });
  await page.goto('/apps/planner/');
});

const cell = (page, key) => page.locator(`.day-cell[data-key="${key}"]`);
const stored = (page, key) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), key);

test.describe('Planner', () => {
  test('shows June 2026 with weekdays only', async ({ page }) => {
    await expect(page.locator('#month-label')).toContainText('June 2026');
    await expect(page.locator('.day-name-row span')).toHaveText(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  });

  test('sets a status from the day menu and saves it', async ({ page }) => {
    await cell(page, '2026-06-10').locator('.day-hit').click();
    await page.locator('.popover-option', { hasText: 'Remote' }).click();

    await expect(cell(page, '2026-06-10')).toHaveAttribute('data-status', 'remote');
    await expect(page.locator('#stat-remote')).toHaveText('1');
    expect(await stored(page, 'tr-attendance-days')).toMatchObject({ '2026-06-10': 'remote' });
  });

  test('paint mode paints several days, eraser clears', async ({ page }) => {
    await page.locator('.paint-btn[data-status="in-office"]').click();
    await cell(page, '2026-06-08').click();
    await cell(page, '2026-06-09').click();
    await expect(page.locator('#stat-in-office')).toHaveText('2');

    await page.locator('.paint-btn[data-status="none"]').click();
    await cell(page, '2026-06-08').click();
    await expect(cell(page, '2026-06-08')).not.toHaveAttribute('data-status', /.+/);
    await expect(page.locator('#stat-in-office')).toHaveText('1');
  });

  test('Import holidays overrides existing statuses', async ({ page }) => {
    await cell(page, '2026-06-19').locator('.day-hit').click();
    await page.locator('.popover-option', { hasText: 'In Office' }).click();
    await expect(cell(page, '2026-06-19')).toHaveAttribute('data-status', 'in-office');

    await page.locator('#btn-import-holidays').click();
    await expect(cell(page, '2026-06-19')).toHaveAttribute('data-status', 'holiday');
    await expect(cell(page, '2026-06-19')).toContainText('Juneteenth');
  });

  test('a day note saves, previews and survives a reload', async ({ page }) => {
    await cell(page, '2026-06-11').locator('.note-btn').click();
    await expect(page.locator('#note-dialog')).toBeVisible();
    await page.locator('#note-text').fill('Dentist @ 2pm\nDemo @ 1pm');
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(cell(page, '2026-06-11').locator('.day-note')).toContainText('Dentist @ 2pm');

    await page.reload();
    await expect(cell(page, '2026-06-11').locator('.day-note')).toContainText('Demo @ 1pm');
  });

  test('the note preview shows three lines then an ellipsis', async ({ page }) => {
    await cell(page, '2026-06-12').locator('.note-btn').click();
    await page.locator('#note-text').fill('one\ntwo\nthree\nfour');
    await page.getByRole('button', { name: 'Done' }).click();
    const lines = cell(page, '2026-06-12').locator('.day-note span');
    await expect(lines).toHaveCount(3);
    await expect(lines.nth(2)).toHaveText('three…');
  });

  test('to-dos add, tick and persist', async ({ page }) => {
    await page.locator('#todo-input').fill('Book desk');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await page.locator('.todo-item input[type="checkbox"]').check();
    await page.reload();
    await expect(page.locator('.todo-item.done')).toContainText('Book desk');
  });

  test('keeps data saved under the existing localStorage keys', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('tr-attendance-days', JSON.stringify({ '2026-06-15': 'ooo' })));
    await page.reload();
    await expect(cell(page, '2026-06-15')).toHaveAttribute('data-status', 'ooo');
  });

  test('Clear month asks first, then clears the month', async ({ page }) => {
    await cell(page, '2026-06-10').locator('.day-hit').click();
    await page.locator('.popover-option', { hasText: 'In Office' }).click();
    await page.locator('#btn-clear-month').click();
    await expect(page.locator('#clear-popover')).toBeVisible();
    await page.locator('.clear-popover-confirm').click();
    await expect(cell(page, '2026-06-10')).not.toHaveAttribute('data-status', /.+/);
  });

  test('month navigation moves forward and back', async ({ page }) => {
    await page.getByRole('button', { name: 'Next month' }).click();
    await expect(page.locator('#month-label')).toContainText('July 2026');
    await page.getByRole('button', { name: 'Previous month' }).click();
    await expect(page.locator('#month-label')).toContainText('June 2026');
  });
});
