// axe on every page, both languages, both projects. Any violation fails, except colour contrast:
// the palette is the Stitch design's, so contrast findings are reported (annotation + JSON), not fixed.
import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { STORY as CHAPTERS } from '../src/content/story';
import { LAB, SOURCES, STORY, expect, test } from './fixtures';

async function audit(page: Page, info: TestInfo, name: string) {
  await page.waitForLoadState('networkidle');
  const { violations } = await new AxeBuilder({ page }).analyze();
  const contrast = violations.filter((v) => v.id === 'color-contrast');
  const rest = violations.filter((v) => v.id !== 'color-contrast');
  for (const v of contrast) {
    for (const n of v.nodes) {
      const d = n.any[0]?.data as { contrastRatio?: number; expectedContrastRatio?: string; fgColor?: string; bgColor?: string; fontSize?: string } | undefined;
      info.annotations.push({ type: 'contrast', description: `${name} ${n.target.join(' ')} ${d?.contrastRatio}:1 (needs ${d?.expectedContrastRatio}) ${d?.fgColor} on ${d?.bgColor}, ${d?.fontSize}` });
    }
  }
  expect(rest.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) })), `${name}: axe violations`).toEqual([]);
}

for (const lang of ['en', 'tr'] as const) {
  test(`lab (${lang})`, async ({ page }, info) => {
    await page.goto(`${LAB}?lang=${lang}`);
    await expect(page.locator('#narrative-text')).not.toBeEmpty();
    await audit(page, info, 'lab');
    await page.locator('[data-action="guide"]').click();
    await expect(page.locator('#guide-modal')).toBeVisible();
    await audit(page, info, 'lab+guide');
  });

  test(`story, all chapters (${lang})`, async ({ page }, info) => {
    for (const ch of CHAPTERS[lang]) {
      await page.goto('about:blank');
      await page.goto(`${STORY}?lang=${lang}#${ch.id}`);
      await expect(page.locator('#chapter h1')).toHaveText(ch.title);
      await audit(page, info, `story#${ch.id}`);
    }
  });

  test(`sources (${lang})`, async ({ page }, info) => {
    await page.goto(`${SOURCES}?lang=${lang}`);
    await expect(page.locator('#refs [id^="src-"]')).toHaveCount(24);
    await audit(page, info, 'sources');
  });
}
