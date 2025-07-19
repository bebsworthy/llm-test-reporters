import { test, expect } from '@playwright/test';

test.describe('Assertion Tests', () => {
  test('should fail visual regression', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('should fail on count assertion', async ({ page }) => {
    await page.goto('data:text/html,<ul><li>1</li><li>2</li></ul>');
    await expect(page.locator('li')).toHaveCount(5);
  });

  test('should fail on CSS property', async ({ page }) => {
    await page.goto('data:text/html,<div style="color: red">Text</div>');
    await expect(page.locator('div')).toHaveCSS('color', 'rgb(0, 0, 255)');
  });

  test('should fail on URL assertion', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveURL('https://example.org');
  });

  test('should fail on inner text comparison', async ({ page }) => {
    await page.goto('data:text/html,<p>Hello World</p>');
    const text = await page.locator('p').innerText();
    expect(text).toBe('Goodbye World');
  });

  test('should fail on element count', async ({ page }) => {
    await page.goto('data:text/html,<div></div>');
    const count = await page.locator('span').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should fail on contains text', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page.locator('body')).toContainText('Lorem Ipsum');
  });
});