// Shared by every spec: each test fails on a console error, an uncaught exception, a failed or
// 4xx/5xx request, and pages are checked for horizontal overflow.
import { test as base, expect, type Page } from '@playwright/test';

export const BASE = '/projects/bloch-sphere-simulator/';
export const LAB = BASE;
export const STORY = `${BASE}story.html`;
export const SOURCES = `${BASE}sources.html`;

export const test = base.extend<{ problems: string[] }>({
  locale: 'en-US', // the app picks Turkish from navigator.language; start every test in English
  problems: [
    async ({ context }, use) => {
      const problems: string[] = [];
      context.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
      context.on('weberror', (e) => problems.push(`exception: ${e.error().message}`));
      context.on('requestfailed', (r) => problems.push(`request failed: ${r.url()} ${r.failure()?.errorText}`));
      context.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
      await use(problems);
      expect(problems, 'console errors, exceptions or failed requests').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function expectNoOverflow(page: Page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  expect(sw, 'horizontal overflow').toBeLessThanOrEqual(iw);
}
