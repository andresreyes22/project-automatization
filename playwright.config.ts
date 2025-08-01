import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Playwright configuration for API testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/tests',
  /* Maximum time one test can run for */
  timeout: 30 * 1000,
  expect: {
    /* Maximum time expect() should wait for the condition to be met */
    timeout: 10000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  /* Shared settings for all the projects */
  use: {
    /* Base URL for API requests */
    baseURL: 'https://fakestoreapi.com',
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  projects: [
    {
      name: 'API Tests',
      testMatch: '**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});