import { test, expect } from '@playwright/test';

test.describe('All Failing Tests', () => {
  test('Test 1 - Should fail', async () => {
    expect('actual').toBe('expected'); // Will fail: Assertion error
  });

  test('Test 2 - Should fail', async () => {
    const arr: number[] = null as any;
    expect(arr.length).toBe(0); // Will fail: Type error - Cannot read property 'length' of null
  });

  test('Test 3 - Should fail', async () => {
    test.setTimeout(500);
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(true).toBe(true); // Will fail: Timeout
  });
});