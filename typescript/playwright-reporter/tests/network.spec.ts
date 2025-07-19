import { test, expect } from '@playwright/test';

test.describe('Network and API Tests', () => {
  test('should fail on API response assertion', async ({ page, request }) => {
    const response = await request.get('https://jsonplaceholder.typicode.com/posts/1');
    const data = await response.json();
    expect(data.title).toBe('Wrong Title');
  });

  test('should timeout on slow API', async ({ request }) => {
    const response = await request.get('https://httpstat.us/200?sleep=10000', {
      timeout: 1000
    });
    expect(response.ok()).toBeTruthy();
  });

  test('should fail on response status', async ({ request }) => {
    const response = await request.get('https://httpstat.us/404');
    expect(response.status()).toBe(200);
  });

  test('should intercept and fail', async ({ page }) => {
    await page.route('**/api/data', route => {
      route.fulfill({
        status: 500,
        body: 'Server Error'
      });
    });
    
    await page.goto('data:text/html,<script>fetch("/api/data").then(r => { if (!r.ok) throw new Error("API Failed"); })</script>');
    await page.waitForTimeout(100);
  });

  test('should fail on missing request', async ({ page }) => {
    const responsePromise = page.waitForResponse('**/api/never-called');
    await page.goto('https://example.com');
    await responsePromise; // Will timeout
  });

  test('should fail on request count', async ({ page }) => {
    let requestCount = 0;
    page.on('request', () => requestCount++);
    
    await page.goto('https://example.com');
    expect(requestCount).toBe(10);
  });
});