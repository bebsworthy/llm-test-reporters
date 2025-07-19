import { test, expect } from '@playwright/test';

test.describe('Element Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example.com');
  });

  test('should click non-existent button', async ({ page }) => {
    await page.click('button#does-not-exist');
  });

  test('should fail on incorrect text assertion', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Wrong Text');
  });

  test('should timeout waiting for element', async ({ page }) => {
    await page.waitForSelector('.never-appears', { timeout: 2000 });
  });

  test('should fail to fill non-existent input', async ({ page }) => {
    await page.fill('input#username', 'testuser');
  });

  test('should fail on visibility assertion', async ({ page }) => {
    await expect(page.locator('#hidden-element')).toBeVisible();
  });

  test('should handle multiple element matches', async ({ page }) => {
    await page.goto('data:text/html,<div>Item 1</div><div>Item 2</div>');
    await page.click('div'); // Will fail - multiple elements
  });

  test('should fail on checkbox state', async ({ page }) => {
    await page.goto('data:text/html,<input type="checkbox" id="cb">');
    await expect(page.locator('#cb')).toBeChecked();
  });

  test('should fail on attribute assertion', async ({ page }) => {
    await expect(page.locator('a')).toHaveAttribute('href', '/wrong-link');
  });
});