import { test, expect } from '@playwright/test';

test.describe('Timeout Scenarios', () => {
  test('should timeout on page load', async ({ page }) => {
    test.setTimeout(2000);
    await page.goto('https://httpstat.us/200?sleep=5000', {
      timeout: 1000
    });
  });

  test('should timeout on element wait', async ({ page }) => {
    await page.goto('https://example.com');
    await page.waitForSelector('.element-that-never-appears', {
      timeout: 1000
    });
  });

  test('should timeout on navigation wait', async ({ page }) => {
    await page.goto('https://example.com');
    const navigationPromise = page.waitForNavigation({ timeout: 1000 });
    // Don't actually navigate
    await navigationPromise;
  });

  test('should timeout on custom wait', async ({ page }) => {
    await page.goto('https://example.com');
    await page.waitForFunction(() => false, { timeout: 500 });
  });

  test('should timeout entire test', async ({ page }) => {
    test.setTimeout(1000);
    await page.goto('https://example.com');
    await page.waitForTimeout(2000);
  });

  test('should timeout on response wait', async ({ page }) => {
    const responsePromise = page.waitForResponse('**/api/data', { timeout: 500 });
    await page.goto('https://example.com');
    await responsePromise;
  });

  test.describe('Hook Timeouts', () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(500);
      await page.goto('https://httpstat.us/200?sleep=1000');
    });

    test('should not run due to hook timeout', async ({ page }) => {
      await expect(page).toHaveTitle(/Example/);
    });
  });
});