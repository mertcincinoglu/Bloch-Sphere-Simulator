import type { Page } from '@playwright/test';
import { EN } from '../src/strings';
import { TR_STATIC, TR_STRINGS } from '../src/tr';
import { LAB, expect, expectNoOverflow, test } from './fixtures';

async function open(page: Page, url = LAB) {
  await page.goto(url);
  await expect(page.locator('#narrative-text')).not.toBeEmpty();
}

async function expectCoords(page: Page, x: string, y: string, z: string) {
  await expect(page.locator('#coord-x')).toHaveText(x);
  await expect(page.locator('#coord-y')).toHaveText(y);
  await expect(page.locator('#coord-z')).toHaveText(z);
}

// the control deck shows one tab at a time
async function tab(page: Page, name: 'state' | 'gates' | 'measure') {
  await page.locator(`#tab-${name}`).click();
  await expect(page.locator(`#panel-${name}`)).toBeVisible();
}

async function openCustom(page: Page) {
  const box = page.locator('details:has(#custom-rotation)');
  if (!(await box.getAttribute('open') !== null)) await box.locator('summary').click();
}

async function resetToZero(page: Page) {
  await page.locator('[data-action="reset-zero"]').first().click();
  await expectCoords(page, '0.000', '0.000', '+1.000');
}

test.beforeEach(async ({ page }) => open(page));
test.afterEach(async ({ page }) => expectNoOverflow(page));

test('opens on |+⟩ with matching readouts', async ({ page }) => {
  await expectCoords(page, '+1.000', '0.000', '0.000');
  await expect(page.locator('#readout-theta')).toHaveText('0.50 π (90.0°)');
  await expect(page.locator('#bases [data-row="Z"] b')).toHaveText('50.0% / 50.0%');
  await expect(page.locator('#bases [data-row="X"] b')).toHaveText('100.0% / 0.0%');
  await expect(page.locator('#narrative-text')).toHaveText(EN['story.initial']);
});

test('H then S from |0⟩', async ({ page }) => {
  await resetToZero(page);
  await page.locator('[data-gate="H"]').click();
  await expectCoords(page, '+1.000', '0.000', '0.000');
  await expect(page.locator('#narrative-text')).toHaveText(EN['story.H']);
  await expect(page.locator('#history button').last()).toHaveText('H');
  await page.locator('[data-gate="S"]').click();
  await expectCoords(page, '0.000', '+1.000', '0.000');
  await expect(page.locator('#matrix-label')).toHaveText(EN['label.S']);
});

test('custom rotation: axis X by π/2 sends |0⟩ to −Y; bad input shows an error', async ({ page }) => {
  await resetToZero(page);
  await openCustom(page);
  await page.locator('#cr-theta').fill('0.5π');
  await page.locator('#cr-phi').fill('0');
  await page.locator('#cr-angle').fill('π/2');
  await page.locator('#custom-rotation [type="submit"]').click();
  await expectCoords(page, '0.000', '−1.000', '0.000');
  await expect(page.locator('#cr-error')).toBeEmpty();

  await page.locator('#cr-angle').fill('half a turn');
  await page.locator('#custom-rotation [type="submit"]').click();
  await expect(page.locator('#cr-error')).toHaveText(EN['custom.error']);
  await expectCoords(page, '0.000', '−1.000', '0.000'); // nothing applied
});

test('length slider: r = 0 hides the angles, r = 1 brings back the same direction', async ({ page }) => {
  await page.locator('[data-gate="S"]').click(); // |+⟩ → |i⟩, a direction that is not the default
  await expectCoords(page, '0.000', '+1.000', '0.000');
  await tab(page, 'state');
  const r = page.locator('#slider-radius');
  await r.fill('0');
  await expect(page.locator('#readout-theta')).toHaveText('—');
  await expect(page.locator('#readout-phi')).toHaveText('—');
  await expect(page.locator('#readout-r')).toHaveText(`0.00 (${EN['r.mixed']})`);
  await expectCoords(page, '0.000', '0.000', '0.000');
  await r.fill('1');
  await expectCoords(page, '0.000', '+1.000', '0.000');
  await expect(page.locator('#readout-theta')).toHaveText('0.50 π (90.0°)');
  await expect(page.locator('#readout-phi')).toHaveText('0.50 π (90.0°)');
});

test('Y basis: measuring |i⟩ 1000 times gives 1000/0', async ({ page }) => {
  await tab(page, 'state');
  await page.locator('[data-preset="0.5,0.5"]').click();
  await expectCoords(page, '0.000', '+1.000', '0.000');
  await tab(page, 'measure');
  await page.locator('[data-basis="Y"]').click();
  await expect(page.locator('[data-basis="Y"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-action="measure-many"]').click();
  await expect(page.locator('#count-result-0')).toHaveText('|i⟩: 1000 (100.0%)');
  await expect(page.locator('#count-result-1')).toHaveText('|−i⟩: 0 (0.0%)');
});

test('a gate clears the measurement counts', async ({ page }) => {
  await tab(page, 'measure');
  await page.locator('[data-action="measure-many"]').click();
  await expect(page.locator('#count-result-0')).not.toHaveText('|0⟩: 0 (0.0%)');
  await tab(page, 'gates');
  await page.locator('[data-gate="X"]').click();
  await expect(page.locator('#count-result-0')).toHaveText('|0⟩: 0 (0.0%)');
  await expect(page.locator('#count-result-1')).toHaveText('|1⟩: 0 (0.0%)');
  await expect(page.locator('#collapse-status')).toHaveText(EN['status.unmeasured']);
});

test('share writes #t=…&p=…&r=… and the link restores the state', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('[data-gate="S"]').click(); // (0, 1, 0)
  await expectCoords(page, '0.000', '+1.000', '0.000');
  await tab(page, 'state');
  await page.locator('#slider-radius').fill('0.5');
  await expectCoords(page, '0.000', '+0.500', '0.000');
  await page.locator('[data-action="share"]').click();
  await expect(page.locator('#toast')).toHaveText(EN['share.copied']);
  const url = page.url();
  expect(url).toMatch(/#t=1\.5708&p=1\.5708&r=0\.500$/);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);

  const other = await context.newPage();
  await open(other, url);
  await expectCoords(other, '0.000', '+0.500', '0.000');
  await expect(other.locator('#readout-r')).toHaveText(`0.50 (${EN['r.mixed']})`);
  await expect(other.locator('#narrative-text')).toContainText(EN['story.shared'].split(':')[0]);
});

test('language switch to TR changes html[lang] and texts, and survives a reload', async ({ page }) => {
  await page.locator('[data-lang="tr"]').click();
  const check = async () => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    await expect(page.locator('#tab-gates')).toHaveText(TR_STATIC['tab.gates']);
    await expect(page.locator('[data-action="measure-many"] span')).toHaveText(TR_STATIC['measure.many']);
    await expect(page.locator('#narrative-text')).toHaveText(TR_STRINGS['story.initial']!);
    await expect(page.locator('[data-lang="tr"]')).toHaveAttribute('aria-pressed', 'true');
  };
  await check();
  expect(new URL(page.url()).searchParams.get('lang')).toBe('tr');
  await page.reload();
  await check();
  await open(page, LAB); // no ?lang: the choice comes back from storage
  await check();
  await page.locator('[data-lang="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#tab-gates')).toHaveText('Gates');
});

test('guide modal opens, Escape closes it and focus goes back', async ({ page }) => {
  const modal = page.locator('#guide-modal');
  const opener = page.locator('[data-action="guide"]');
  await expect(modal).toBeHidden();
  await opener.click();
  await expect(modal).toBeVisible();
  await expect(page.locator('#guide-title')).toHaveText('The Geometry of One Qubit');
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();
});

test('keyboard: the sphere takes focus and arrow keys turn the view', async ({ page }) => {
  const sphere = page.locator('#sphere');
  await sphere.focus();
  await expect(sphere).toBeFocused();
  const label = page.locator('#sphere .axis-label', { hasText: '+X (|+⟩)' });
  const before = await label.evaluate((el) => (el as HTMLElement).style.transform);
  for (const key of ['ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) await page.keyboard.press(key);
  await expect.poll(() => label.evaluate((el) => (el as HTMLElement).style.transform)).not.toBe(before);
  await expect(sphere).toBeFocused();
});

test('history: each step gets a chip; undo and a chip go back; a new step drops the rest', async ({ page }, info) => {
  const chips = page.locator('#history button');
  await expect(chips).toHaveText(['|+⟩']);
  await page.locator('[data-gate="H"]').click(); // |+⟩ → |0⟩
  await expectCoords(page, '0.000', '0.000', '+1.000');
  await page.locator('[data-gate="X"]').click(); // → |1⟩
  await expectCoords(page, '0.000', '0.000', '−1.000');
  await expect(chips).toHaveText(['|+⟩', 'H', 'X']);
  await expect(chips.nth(2)).toHaveAttribute('aria-current', 'step');
  await page.locator('[data-action="undo"]').first().click();
  await expectCoords(page, '0.000', '0.000', '+1.000');
  await expect(page.locator('#narrative-text')).toHaveText(EN['story.undo']);
  if (info.project.name === 'phone') return; // the strip is hidden on phones; undo is there
  await chips.nth(0).click();
  await expectCoords(page, '+1.000', '0.000', '0.000');
  await expect(chips.nth(0)).toHaveAttribute('aria-current', 'step');
  await page.locator('[data-gate="Z"]').click(); // |+⟩ → |−⟩, replaces H and X
  await expectCoords(page, '−1.000', '0.000', '0.000');
  await expect(chips).toHaveText(['|+⟩', 'Z']);
});

test('keyboard shortcuts: gates, S†, measure, undo, reset; ignored while typing', async ({ page }) => {
  await page.locator('h1').click();
  await page.keyboard.press('s'); // |+⟩ → |i⟩
  await expectCoords(page, '0.000', '+1.000', '0.000');
  await page.keyboard.press('Shift+S'); // S† brings it back
  await expectCoords(page, '+1.000', '0.000', '0.000');
  await expect(page.locator('#matrix-label')).toHaveText(EN['label.Sdg']);
  await page.keyboard.press('u');
  await expectCoords(page, '0.000', '+1.000', '0.000');
  await page.keyboard.press('r');
  await expectCoords(page, '0.000', '0.000', '+1.000');
  await page.keyboard.press('m'); // |0⟩ in Z always gives |0⟩
  await expect(page.locator('#count-result-0')).toHaveText('|0⟩: 1 (100.0%)');
  await expect(page.locator('#history button').last()).toHaveText('M(Z)→|0⟩');
  await openCustom(page);
  await page.locator('#cr-theta').fill('');
  await page.locator('#cr-theta').press('x'); // typing, not a gate
  await expectCoords(page, '0.000', '0.000', '+1.000');
});

test('H on |0⟩ reads φ = 0, not 2π, and names |+⟩', async ({ page }) => {
  await resetToZero(page);
  await page.locator('[data-gate="H"]').click();
  await expectCoords(page, '+1.000', '0.000', '0.000');
  await expect(page.locator('#readout-phi')).toHaveText('0.00 π (0.0°)');
  await expect(page.locator('#formula-numeric')).toHaveText('0.707 |0⟩ + 0.707 |1⟩ = |+⟩');
});

test('control deck tabs: click and arrow keys switch panels', async ({ page }) => {
  await expect(page.locator('#panel-gates')).toBeVisible();
  await expect(page.locator('#panel-state')).toBeHidden();
  await tab(page, 'measure');
  await expect(page.locator('#tab-measure')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight'); // wraps to State
  await expect(page.locator('#panel-state')).toBeVisible();
  await expect(page.locator('#tab-state')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#panel-measure')).toBeVisible();
});

test('clear history keeps only the present step', async ({ page }) => {
  await page.locator('[data-gate="H"]').click();
  await expectCoords(page, '0.000', '0.000', '+1.000');
  await page.locator('[data-action="clear-history"]').click();
  await expect(page.locator('#history button')).toHaveText(['H']);
  await expectCoords(page, '0.000', '0.000', '+1.000');
});

test('slider marks sit under the thumb: φ = 3π/2 lands exactly on −Y', async ({ page }) => {
  await tab(page, 'state');
  const phi = page.locator('#slider-phi');
  await phi.fill('270');
  await expect(page.locator('#readout-phi')).toHaveText('1.50 π (270.0°)');
  await expectCoords(page, '0.000', '−1.000', '0.000');
  const box = (await phi.boundingBox())!;
  const mark = (await page.locator('#panel-state .scale').nth(1).locator(':scope > span').nth(3).boundingBox())!;
  expect(Math.abs(mark.x + mark.width / 2 - (box.x + 9 + (box.width - 18) * 0.75))).toBeLessThan(1.5);
  // the ends are exactly π and 2π
  await page.locator('#slider-theta').fill('180');
  await expect(page.locator('#readout-theta')).toHaveText('1.00 π (180.0°)');
  await expectCoords(page, '0.000', '0.000', '−1.000');
  await page.locator('#slider-theta').fill('90');
  await phi.fill('360');
  await expect(page.locator('#readout-phi')).toHaveText('2.00 π (360.0°)');
  await expect(phi).toHaveValue('360'); // the thumb stays at the end
  await expectCoords(page, '+1.000', '0.000', '0.000');
});

test('zoom: buttons and the wheel change the zoom; reset view brings it back', async ({ page }) => {
  const label = page.locator('#sphere .axis-label', { hasText: '+X (|+⟩)' });
  const where = () => label.evaluate((el) => (el as HTMLElement).style.transform);
  const before = await where();
  await page.locator('[data-action="zoom-in"]').click();
  await expect.poll(where).not.toBe(before);
  await page.locator('[data-action="reset-view"]').click();
  await expect.poll(where).toBe(before);
  const box = (await page.locator('#sphere').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -300);
  await expect.poll(where).not.toBe(before);
});

test('measurement: an empty run shows an empty bar, and the status counts every run', async ({ page }) => {
  await tab(page, 'measure');
  await expect(page.locator('#bar-measure-0')).toHaveAttribute('style', /width: 0(\.0)?%/);
  await page.locator('[data-action="measure-many"]').click();
  await page.locator('[data-action="measure-many"]').click();
  await expect(page.locator('#collapse-status')).toHaveText(EN['status.sampled'].replace('{n}', '2,000'));
});

test('notice: shows in the chosen language, closes, and stays closed after a reload', async ({ page }) => {
  const notice = page.locator('#notice');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('under construction');
  await page.locator('[data-lang="tr"]').click();
  await expect(notice).toContainText('yapım aşamasında');
  await page.locator('[data-action="close-notice"]').click();
  await expect(notice).toBeHidden();
  await page.reload();
  await expect(page.locator('#narrative-text')).not.toBeEmpty();
  await expect(notice).toBeHidden();
});

test('at θ = 0 the θ label reads "θ = 0" and moves beside the arrow', async ({ page }) => {
  await tab(page, 'state');
  await page.locator('#slider-theta').fill('0');
  const label = page.locator('#sphere .axis-label.guide', { hasText: 'θ' }).first();
  await expect(label).toHaveText('θ = 0');
  await page.locator('#slider-theta').fill('90');
  await expect(label).toHaveText('θ');
});
