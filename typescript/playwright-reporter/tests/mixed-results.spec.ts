import { test, expect } from '@playwright/test';

test.describe('Mixed Results', () => {
  test('Test 1 - Should pass', async () => {
    expect(10).toBeGreaterThan(5);
  });

  test('Test 2 - Should fail', async () => {
    expect(2 + 2).toBe(5); // Will fail: Expected 5 but got 4
  });

  test('Test 3 - Should pass', async () => {
    expect(['apple', 'banana']).toContain('apple');
  });

  test('Test 4 - Should fail', async () => {
    const obj: any = undefined;
    expect(obj.property).toBe('value'); // Will fail: Cannot read property of undefined
  });

  test.skip('Test 5 - Should skip', async () => {
    expect(false).toBe(true);
  });
});