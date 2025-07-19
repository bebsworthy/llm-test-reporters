import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
  });

  test('should fail on non-existent page', async ({ page }) => {
    await page.goto('https://example.com/non-existent-page-404');
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('should timeout on slow loading page', async ({ page }) => {
    test.setTimeout(3000);
    await page.goto('https://httpstat.us/200?sleep=5000');
    await expect(page).toHaveTitle(/HTTP Status/);
  });

  test('should fail on network error', async ({ page }) => {
    await page.goto('https://this-domain-definitely-does-not-exist-12345.com');
  });

  test('should handle navigation to invalid URL', async ({ page }) => {
    await page.goto('not-a-valid-url');
  });

  test('should detect console errors', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        throw new Error(`Console error: ${msg.text()}`);
      }
    });
    
    await page.goto('data:text/html,<script>console.error("Test error")</script>');
    await page.waitForTimeout(100);
  });
});