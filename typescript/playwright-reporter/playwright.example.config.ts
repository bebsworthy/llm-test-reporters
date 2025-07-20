import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts', // Run all test files
  timeout: 5 * 1000,
  expect: {
    timeout: 2000
  },
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['./dist/index.js', {
    mode: process.env.LLM_OUTPUT_MODE || 'summary',
    includePassedSuites: false,
    maxValueLength: 100
  }]],
  use: {
    headless: true,
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
    // Ensure browser closes properly
    launchOptions: {
      timeout: 10000
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ]
});