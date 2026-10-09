import type { Page } from '@playwright/test';
import { STORY as CHAPTERS, type Chapter, type Lang } from '../src/content/story';
import { EN } from '../src/strings';
import { TR_STRINGS } from '../src/tr';
import { STORY, expect, expectNoOverflow, test } from './fixtures';

const FIGURES: Record<Chapter['figure']['type'], number> = { sphere: 1, compare: 2, entangle: 2, none: 0 };
const IDS = CHAPTERS.en.map((c) => c.id);

async function openChapter(page: Page, id: string, lang: Lang = 'en') {
  const ch = CHAPTERS[lang].find((c) => c.id === id)!;
  await page.goto(`${STORY}?lang=${lang}#${id}`);
  await expect(page.locator('#chapter h1')).toHaveText(ch.title);
  return ch;
}

const plate = (page: Page) => page.locator('#chapter > section');
const many = (page: Page) => plate(page).getByRole('button', { name: EN['sp.many'], exact: true });

/** "|0⟩: 742 (74.2%)" → 742 */
const count = async (page: Page, text: RegExp) => Number((await plate(page).getByText(text).first().textContent())!.match(/: (\d+) \(/)![1]);

test.afterEach(async ({ page }) => expectNoOverflow(page));

for (const lang of ['en', 'tr'] as const) {
  test(`every chapter loads (${lang})`, async ({ page }) => {
    const chapters = CHAPTERS[lang];
    expect(chapters.map((c) => c.id)).toEqual(IDS);
    for (const [i, ch] of chapters.entries()) {
      await page.goto('about:blank');
      await openChapter(page, ch.id, lang);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('#reading-chapter')).toHaveText(
        (lang === 'tr' ? TR_STRINGS['sp.chapterOf']! : EN['sp.chapterOf']).replace('{n}', String(i + 1)).replace('{total}', '8'));
      await expect(page.locator('#toc [aria-current="page"]')).toContainText(ch.title);
      await expect(page.locator('#chapter canvas')).toHaveCount(FIGURES[ch.figure.type]);
      await expect(page.locator('#chapter footer').first()).toHaveText(ch.caption);
      await expectNoOverflow(page);
    }
  });
}

test('table of contents switches chapters', async ({ page }) => {
  await openChapter(page, 'qubit');
  const phase = CHAPTERS.en.find((c) => c.id === 'phase')!;
  await page.locator('#toc a', { hasText: phase.title }).click();
  await expect(page).toHaveURL(/#phase$/);
  await expect(page.locator('#chapter h1')).toHaveText(phase.title);
  await expect(page.locator('#toc [aria-current="page"]')).toContainText(phase.title);
  await expect(page.locator('#reading-chapter')).toHaveText('Chapter 4 of 8');
});

test('measure chapter: 1000 shots fill the counts near cos²(π/6) = 75%', async ({ page }) => {
  await openChapter(page, 'measure');
  await expect(plate(page).getByText('Total shots: 0')).toBeVisible();
  await many(page).click();
  await expect(plate(page).getByText('Total shots: 1000')).toBeVisible();
  const zero = await count(page, /^\|0⟩: \d+/), one = await count(page, /^\|1⟩: \d+/);
  expect(zero + one).toBe(1000);
  expect(zero).toBeGreaterThan(690); // 750 ± 4.4σ
  expect(zero).toBeLessThan(810);
});

test('compare chapter: X basis gives 1000 |+⟩ on the left, about 50/50 on the right', async ({ page }) => {
  await openChapter(page, 'mixed');
  await plate(page).getByRole('button', { name: 'X (|+⟩ / |−⟩)' }).click();
  await expect(plate(page).getByRole('button', { name: 'X (|+⟩ / |−⟩)' })).toHaveAttribute('aria-pressed', 'true');
  await plate(page).getByRole('button', { name: EN['sp.both'] }).click();
  const cards = plate(page).locator('div.bg-surface.border-on-surface.p-4');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0).getByText(/^\|\+⟩: /)).toHaveText('|+⟩: 1000 (100.0%)');
  await expect(cards.nth(0).getByText(/^\|−⟩: /)).toHaveText('|−⟩: 0 (0.0%)');
  const right = Number((await cards.nth(1).getByText(/^\|\+⟩: /).textContent())!.match(/: (\d+)/)![1]);
  const rightMinus = Number((await cards.nth(1).getByText(/^\|−⟩: /).textContent())!.match(/: (\d+)/)![1]);
  expect(right + rightMinus).toBe(1000);
  expect(right).toBeGreaterThan(430); // 500 ± 4.4σ
  expect(right).toBeLessThan(570);
});

test('entanglement slider at t = 1 shows |r| = 0.00', async ({ page }) => {
  await openChapter(page, 'entanglement');
  await expect(plate(page).getByText(/Each qubit alone: \|r\| = 1\.00/)).toBeVisible();
  await plate(page).locator('input[type="range"]').fill('1');
  await expect(plate(page).getByText('Each qubit alone: |r| = 0.00, Tr ρ² = 0.500')).toBeVisible();
  await expect(plate(page).getByText('|ψ⟩ = 0.707 |00⟩ + 0.707 |11⟩')).toBeVisible();
});

test('previous / next links walk the chapters', async ({ page }) => {
  await openChapter(page, 'qubit');
  await expect(page.getByRole('link', { name: /PREVIOUS CHAPTER/ })).toHaveCount(0);
  await page.getByRole('link', { name: /NEXT CHAPTER/ }).click();
  await expect(page).toHaveURL(/#angles$/);
  await expect(page.locator('#chapter h1')).toHaveText(CHAPTERS.en[1].title);
  await page.getByRole('link', { name: /PREVIOUS CHAPTER/ }).click();
  await expect(page).toHaveURL(/#qubit$/);
  await openChapter(page, 'limits');
  await expect(page.getByRole('link', { name: /NEXT CHAPTER/ })).toHaveCount(0);
});

test('switching chapters disposes the old WebGL canvases', async ({ page }) => {
  await openChapter(page, 'qubit');
  for (const id of ['mixed', 'gates', 'entanglement', 'limits', 'measure', 'mixed']) {
    const ch = CHAPTERS.en.find((c) => c.id === id)!;
    await page.locator('#toc a', { hasText: ch.title }).click();
    await expect(page.locator('#chapter h1')).toHaveText(ch.title);
    await expect(page.locator('canvas')).toHaveCount(FIGURES[ch.figure.type]);
  }
  // a language switch rebuilds the chapter too
  await page.locator('[data-lang="tr"]').click();
  await expect(page.locator('#chapter h1')).toHaveText(CHAPTERS.tr.find((c) => c.id === 'mixed')!.title);
  await expect(page.locator('canvas')).toHaveCount(2);
});

test('many chapter switches never hit the browser WebGL context limit', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (m) => { if (/WebGL|THREE/.test(m.text())) warnings.push(m.text()); });
  await openChapter(page, 'qubit');
  for (let i = 0; i < 10; i++) {
    for (const id of ['mixed', 'entanglement']) { // 2 spheres each: 40 contexts made in all
      await page.evaluate((h) => { location.hash = h; }, id);
      await expect(page.locator('#chapter h1')).toHaveText(CHAPTERS.en.find((c) => c.id === id)!.title);
    }
  }
  await expect(page.locator('canvas')).toHaveCount(2);
  expect(warnings).toEqual([]);
});
