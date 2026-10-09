// Touch and small-screen behaviour; runs only in the phone project.
import type { Page } from '@playwright/test';
import { STORY as CHAPTERS } from '../src/content/story';
import { LAB, SOURCES, STORY, expect, expectNoOverflow, test } from './fixtures';

const SHOTS = 'C:/Users/Mert/.claude/jobs/8f42b0fe/tmp/qa';

test.skip(({ isMobile }) => !isMobile, 'phone only');
test.afterEach(async ({ page }) => expectNoOverflow(page));

const sphereSection = (page: Page) => page.locator('main > section').first();

async function openLab(page: Page) {
  await page.goto(LAB);
  await expect(page.locator('#narrative-text')).not.toBeEmpty();
}

test('the sphere stays stuck to the top while the gates are scrolled into view', async ({ page }) => {
  await openLab(page);
  const gates = page.locator('[data-gate="H"]');
  await page.evaluate(() => scrollBy(0, 900));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  const sec = (await sphereSection(page).boundingBox())!;
  expect(sec.y).toBe(0);
  // bring H just below the sticky sphere: it must be visible and not covered
  await gates.evaluate((el, top) => scrollBy(0, el.getBoundingClientRect().top - top - 8), sec.height);
  const g = (await gates.boundingBox())!;
  expect((await sphereSection(page).boundingBox())!.y).toBe(0);
  expect(g.y).toBeGreaterThanOrEqual(sec.height);
  expect(g.y + g.height).toBeLessThanOrEqual(844);
  const onTop = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('[data-gate]')?.getAttribute('data-gate'), { x: g.x + g.width / 2, y: g.y + g.height / 2 });
  expect(onTop).toBe('H');
  await page.screenshot({ path: `${SHOTS}/phone-lab-sticky-gates.png` });
});

test('tapping a gate turns the arrow', async ({ page }) => {
  await openLab(page);
  await page.locator('[data-gate="H"]').tap(); // |+⟩ → |0⟩
  await expect(page.locator('#coord-z')).toHaveText('+1.000');
  await expect(page.locator('#coord-x')).toHaveText('0.000');
  await page.locator('[data-gate="X"]').tap(); // |0⟩ → |1⟩
  await expect(page.locator('#coord-z')).toHaveText('−1.000');
  await expect(page.locator('#bases [data-row="Z"] b')).toHaveText('0% / 100%');
});

test('a vertical swipe that starts on the sphere scrolls the page', async ({ page }) => {
  await openLab(page);
  const labels = page.locator('#sphere .labels');
  await expect(labels).toHaveCSS('touch-action', 'pan-y');
  const box = (await page.locator('#sphere').boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.labels') !== null, { x, y });
  expect(hit, 'the swipe starts on the labels layer').toBe(true);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  // a real touch drag (CDP), so the browser decides from touch-action whether the page may pan
  const cdp = await page.context().newCDPSession(page);
  const swipe = async () => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 25 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await swipe();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await page.screenshot({ path: `${SHOTS}/phone-lab-after-swipe.png` });

  // control: the same drag with touch-action: none must not scroll, so the check above means something
  await page.evaluate(() => scrollTo(0, 0));
  await labels.evaluate((el) => { (el as HTMLElement).style.touchAction = 'none'; });
  await swipe();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

const pages: Array<[string, string]> = [
  ['lab', LAB],
  ['sources', SOURCES],
  ...CHAPTERS.en.map((c): [string, string] => [`story#${c.id}`, `${STORY}#${c.id}`]),
];

test('every visible button is at least 24 px tall', async ({ page }) => {
  const small: string[] = [];
  for (const [name, url] of pages) {
    await page.goto('about:blank');
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const found = await page.locator('button, summary, [role="button"]').evaluateAll((els) => els
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ el, r }) => r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden')
      .filter(({ r }) => r.height < 24)
      .map(({ el, r }) => `${(el.textContent ?? '').trim().slice(0, 24) || el.getAttribute('aria-label')} (${r.height.toFixed(1)}px)`));
    small.push(...found.map((f) => `${name}: ${f}`));
  }
  expect(small).toEqual([]);
});
