import { defineConfig, devices } from '@playwright/test';

// SwiftShader gives headless Chromium a software WebGL context for three.js.
const launchOptions = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: 4, // each page runs a software-rendered WebGL loop; more workers starve the CPU and time out
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4431', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 }, launchOptions } },
    {
      name: 'phone',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, launchOptions },
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4431 --strictPort',
    url: 'http://localhost:4431/projects/bloch-sphere-simulator/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
