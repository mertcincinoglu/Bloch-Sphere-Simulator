/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// The build is served from /projects/bloch-sphere-simulator on mertcincinoglu.com (no trailing slash),
// so asset paths must be absolute.
export default defineConfig({
  base: '/projects/bloch-sphere-simulator/',
  plugins: [tailwindcss()],
  build: {
    rolldownOptions: {
      input: { lab: 'index.html', story: 'story.html', sources: 'sources.html' },
    },
  },
  // unit tests only; the Playwright suite in e2e/ runs with `npm run e2e`
  test: { include: ['src/**/*.test.ts'] },
});
