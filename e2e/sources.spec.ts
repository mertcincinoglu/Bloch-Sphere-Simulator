import { SOURCES as REFS } from '../src/content/sources';
import { SOURCES, expect, expectNoOverflow, test } from './fixtures';

test.afterEach(async ({ page }) => expectNoOverflow(page));

for (const lang of ['en', 'tr'] as const) {
  test(`all 24 references render, numbered in order (${lang})`, async ({ page }) => {
    await page.goto(`${SOURCES}?lang=${lang}`);
    const entries = page.locator('#refs [id^="src-"]');
    await expect(entries).toHaveCount(24);
    expect(REFS).toHaveLength(24);
    const rows = await entries.evaluateAll((els) => els.map((el) => ({ id: el.id, n: el.querySelector('span')!.textContent })));
    expect(rows).toEqual(REFS.map((s, i) => ({ id: `src-${s.id}`, n: `[${i + 1}]` })));
    await expect(page.locator('#ref-count')).toContainText('24');
    for (const [i, s] of REFS.entries()) await expect(entries.nth(i)).toContainText(s.note[lang]);
  });
}

test('#src-hu-2024 exists and a deep link lands on it', async ({ page }) => {
  await page.goto(`${SOURCES}#src-hu-2024`);
  const entry = page.locator('#src-hu-2024');
  await expect(entry).toHaveCount(1);
  await expect(entry).toContainText('[11]');
  await expect(entry).toBeInViewport();
});

test('external links open in a new tab with rel=noopener', async ({ page }) => {
  await page.goto(SOURCES);
  const links = page.locator('#refs a[href^="http"]');
  await expect(links).toHaveCount(24);
  const attrs = await links.evaluateAll((els) => els.map((a) => ({ href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') })));
  expect(attrs.map((a) => a.href)).toEqual(REFS.map((s) => s.url));
  for (const a of attrs) expect(a, a.href!).toMatchObject({ target: '_blank', rel: 'noopener' });
  // every other link that opens a new tab carries noopener as well
  const blank = await page.locator('a[target="_blank"]').evaluateAll((els) => els.map((a) => a.getAttribute('rel')));
  expect(blank.every((rel) => rel?.split(' ').includes('noopener'))).toBe(true);
});
