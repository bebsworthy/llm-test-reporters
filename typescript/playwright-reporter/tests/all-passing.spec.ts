import { test, expect } from '@playwright/test';

test.describe('All Passing Tests', () => {
  test('Test 1 - Should pass', async () => {
    expect(1 + 1).toBe(2);
  });

  test('Test 2 - Should pass', async () => {
    expect('hello world').toContain('world');
  });

  test('Test 3 - Should pass', async () => {
    expect(true).toBeTruthy();
  });
});