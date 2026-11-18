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
    // Legacy generic OOO migrates to Vacation
    await expect(cell(page, '2026-06-15')).toHaveAttribute('data-status', 'vacation');
  });

  test('OOO paint picks a type and updates yearly balances', async ({ page }) => {
    await page.locator('.paint-btn[data-status="ooo"]').click();
    await page.locator('.ooo-type-btn[data-type="sick"]').click();
    await cell(page, '2026-06-08').click();
    await cell(page, '2026-06-09').click();
    await expect(cell(page, '2026-06-08')).toHaveAttribute('data-status', 'sick');
    await expect(page.locator('.bal-row[data-status="sick"] .bal-used')).toHaveText('2 days');
    await expect(page.locator('.bal-row[data-status="sick"] .bal-sub')).toHaveText('8 days left');
    // Caregiver is hidden until used
    await expect(page.locator('.bal-row[data-status="caregiver"]')).toHaveCount(0);
  });

  test('weekly paint fills Mon–Fri, keeps holidays, counts one week', async ({ page }) => {
    await page.locator('#btn-import-holidays').click();
    await page.locator('.paint-btn[data-status="wfa"]').click();
    await cell(page, '2026-06-17').click();
    for (const d of ['15', '16', '17', '18']) {
      await expect(cell(page, `2026-06-${d}`)).toHaveAttribute('data-status', 'wfa');
    }
    await expect(cell(page, '2026-06-19')).toHaveAttribute('data-status', 'holiday');
    await expect(page.locator('.bal-row[data-status="wfa"]')).toContainText('1 week');
    await expect(page.locator('.bal-row[data-status="wfa"]')).toContainText('7 of 8 weeks left');
  });

  test('the day menu sets a weekly type for the whole week, and Clear removes the week', async ({ page }) => {
    await page.locator('#btn-import-holidays').click();
    await cell(page, '2026-06-17').locator('.day-hit').click();
    // Uncommon types sit under "More"
    await expect(page.locator('.popover-option', { hasText: 'Parental Leave' })).toBeHidden();
    await page.locator('.popover-more').click();
    await expect(page.locator('.popover-note')).toHaveText('Sets entire week');
    await page.locator('.popover-option', { hasText: 'Parental Leave' }).click();
    for (const d of ['15', '16', '17', '18']) {
      await expect(cell(page, `2026-06-${d}`)).toHaveAttribute('data-status', 'parental');
    }
    await expect(cell(page, '2026-06-19')).toHaveAttribute('data-status', 'holiday');
    await expect(page.locator('.week-more')).toHaveCount(0);

    await cell(page, '2026-06-16').locator('.day-hit').click();
    await page.locator('.popover-option', { hasText: 'Clear' }).click();
    for (const d of ['15', '16', '17', '18']) {
      await expect(cell(page, `2026-06-${d}`)).not.toHaveAttribute('data-status', /.+/);
    }
    await expect(cell(page, '2026-06-19')).toHaveAttribute('data-status', 'holiday');
  });

  test('bereavement is tracked, and balances can be adjusted by hours and days', async ({ page }) => {
    await page.locator('.paint-btn[data-status="ooo"]').click();
    await page.locator('.ooo-type-btn[data-type="bereavement"]').click();
    await cell(page, '2026-06-08').click();
    await expect(page.locator('.bal-row[data-status="bereavement"] .bal-used')).toHaveText('1 day');

    await page.locator('#btn-edit-balances').click();
    const sick = page.locator('.bal-row[data-status="sick"]');
    await sick.getByRole('button', { name: 'Add a day to Sick time' }).click();
    await sick.getByRole('button', { name: 'Add an hour to Sick time' }).click();
    await sick.getByRole('button', { name: 'Add an hour to Sick time' }).click();
    await expect(sick.locator('.bal-added')).toHaveText('Added: 1 day, 2 hours');
    await expect(sick.locator('.bal-used')).toHaveText('1 day, 2 hours');
    await expect(sick.locator('.bal-sub')).toHaveText('8 days, 6 hours left');

    await page.reload();
    await page.locator('#btn-edit-balances').click();
    await expect(page.locator('.bal-row[data-status="sick"] .bal-added')).toHaveText('Added: 1 day, 2 hours');
  });

  test('erasing one day of a weekly item clears the whole week', async ({ page }) => {
    await page.locator('.paint-btn[data-status="sabbatical"]').click();
    await cell(page, '2026-06-10').click();
    await expect(cell(page, '2026-06-08')).toHaveAttribute('data-status', 'sabbatical');
    await page.locator('.paint-btn[data-status="none"]').click();
    await cell(page, '2026-06-10').click();
    for (const d of ['08', '09', '10', '11', '12']) {
      await expect(cell(page, `2026-06-${d}`)).not.toHaveAttribute('data-status', /.+/);
    }
    await expect(page.locator('.bal-row[data-status="sabbatical"]')).toHaveCount(0);
  });

  test('undo and redo appear only when available and revert paint strokes', async ({ page }) => {
    await expect(page.locator('#btn-undo')).toBeHidden();
    await expect(page.locator('#btn-redo')).toBeHidden();

    await page.locator('.paint-btn[data-status="in-office"]').click();
    await cell(page, '2026-06-08').click();
    await cell(page, '2026-06-09').click();
    await expect(page.locator('#btn-undo')).toBeVisible();
    await expect(page.locator('#btn-redo')).toBeHidden();

    await page.locator('#btn-undo').click(); // undoes the last stroke only
    await expect(cell(page, '2026-06-09')).not.toHaveAttribute('data-status', /.+/);
    await expect(cell(page, '2026-06-08')).toHaveAttribute('data-status', 'in-office');
    await expect(page.locator('#btn-redo')).toBeVisible();

    // Undo keeps its slot (invisible) while only redo remains
    await page.locator('#btn-undo').click();
    await expect(page.locator('#btn-undo')).toBeHidden();
    const undoBox = await page.locator('#btn-undo').boundingBox();
    const redoBox = await page.locator('#btn-redo').boundingBox();
    expect(undoBox).not.toBeNull();
    expect(redoBox.x).toBeGreaterThan(undoBox.x);
    await expect(cell(page, '2026-06-08')).not.toHaveAttribute('data-status', /.+/);

    await page.locator('#btn-redo').click();
    await page.locator('#btn-redo').click();
    await expect(cell(page, '2026-06-09')).toHaveAttribute('data-status', 'in-office');
    await expect(page.locator('#btn-redo')).toBeHidden();
  });

  test('undo also reverts manual changes (day menu, week toggle, balance edits)', async ({ page }) => {
    await cell(page, '2026-06-10').locator('.day-hit').click();
    await page.locator('.popover-option', { hasText: 'Remote' }).click();
    await expect(page.locator('#btn-undo')).toBeVisible();
    await page.locator('#btn-undo').click();
    await expect(cell(page, '2026-06-10')).not.toHaveAttribute('data-status', /.+/);
    await expect(page.locator('#btn-undo')).toBeHidden();

    await page.locator('#btn-edit-balances').click();
    const sick = page.locator('.bal-row[data-status="sick"]');
    await sick.getByRole('button', { name: 'Add a day to Sick time' }).click();
    await expect(sick.locator('.bal-used')).toHaveText('1 day');
    await page.locator('#btn-undo').click();
    await expect(sick.locator('.bal-used')).toHaveText('0 days');
    await page.locator('#btn-redo').click();
    await expect(sick.locator('.bal-used')).toHaveText('1 day');
  });

  test('Escape exits paint mode', async ({ page }) => {
    await page.locator('.paint-btn[data-status="remote"]').click();
    await expect(page.locator('#header-mode')).toHaveText('Painting - Remote');
    await page.keyboard.press('Escape');
    await expect(page.locator('#header-mode')).toBeHidden();
    await expect(page.locator('.paint-btn.active')).toHaveCount(0);
  });

  test('parental counts this and last year; sabbatical counts this year and the four before', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('tr-attendance-days', JSON.stringify({
      '2024-05-06': 'parental',                       // 2 years back: not counted
      '2025-12-15': 'parental', '2026-01-12': 'parental',
      '2021-04-05': 'sabbatical',                     // 5 years back: not counted
      '2022-04-04': 'sabbatical', '2026-06-08': 'sabbatical',
      '2025-02-03': 'wfa',                            // WFA still resets yearly
    })));
    await page.reload(); // viewing 2026

    const parental = page.locator('.bal-row[data-status="parental"]');
    await expect(parental).toContainText('2 weeks');
    await expect(parental).toContainText('14 of 16 weeks left');

    const sabbatical = page.locator('.bal-row[data-status="sabbatical"]');
    await expect(sabbatical).toContainText('2 weeks');
    await expect(sabbatical).toContainText('22 of 24 weeks left');

    await expect(page.locator('.bal-row[data-status="wfa"]')).toContainText('0 weeks');

    // 2027: parental keeps only 2026's week; sabbatical drops 2022 (now 5 years back)
    await page.locator('#btn-next').click({ clickCount: 1 });
    for (let i = 0; i < 6; i++) await page.locator('#btn-next').click(); // Dec 2026 → Jan 2027
    await expect(page.locator('#month-label')).toContainText('2027');
    await expect(page.locator('.bal-row[data-status="parental"]')).toContainText('1 week');
    await expect(page.locator('.bal-row[data-status="sabbatical"]')).toContainText('1 week');
  });

  test('a month starting on a weekend skips the empty prior week', async ({ page }) => {
    for (let i = 0; i < 11; i++) await page.getByRole('button', { name: 'Next month' }).click(); // June 2026 → May 2027
    await expect(page.locator('#month-label')).toContainText('May 2027'); // May 1, 2027 is a Saturday
    await expect(page.locator('.day-cell').first()).toHaveAttribute('data-key', '2027-05-03');
    await expect(page.locator('.day-cell').last()).toHaveAttribute('data-key', '2027-06-04');
    await expect(page.locator('.day-cell')).toHaveCount(25);
  });

  test('every month shows exactly 5 week rows (a 4-week February is padded)', async ({ page }) => {
    for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Next month' }).click(); // June 2026 → Feb 2027
    await expect(page.locator('#month-label')).toContainText('February 2027'); // Feb 1 is a Monday, 28 days
    await expect(page.locator('.day-cell')).toHaveCount(25);
    await expect(page.locator('.day-cell').last()).toHaveAttribute('data-key', '2027-03-05');
    await expect(page.locator('.day-cell').last()).toHaveClass(/out-of-month/);

    // Every month in a span of years renders 25 cells
    await page.evaluate(() => {}); // keep page alive
    for (let i = 0; i < 30; i++) {
      await page.getByRole('button', { name: 'Next month' }).click();
      await expect(page.locator('.day-cell')).toHaveCount(25);
    }
  });

  test('the next-month button stays put for every month name', async ({ page }) => {
    const next = page.getByRole('button', { name: 'Next month' });
    const x0 = (await next.boundingBox()).x;
    for (let i = 0; i < 12; i++) {
      await next.click();
      expect(Math.abs((await next.boundingBox()).x - x0)).toBeLessThan(0.5);
    }
  });

  test('parental leave shows in balances only once used', async ({ page }) => {
    await expect(page.locator('.bal-row[data-status="parental"]')).toHaveCount(0);
    await page.locator('.paint-btn[data-status="parental"]').click();
    await cell(page, '2026-06-10').click();
    await expect(page.locator('.bal-row[data-status="parental"]')).toContainText('1 week');
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
