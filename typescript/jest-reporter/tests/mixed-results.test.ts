import { describe, test, expect } from '@jest/globals';

describe('Mixed Results', () => {
  test('Test 1 - Should pass', () => {
    expect(10).toBeGreaterThan(5);
  });

  test('Test 2 - Should fail', () => {
    expect(2 + 2).toBe(5); // Will fail: Expected 5 but got 4
  });

  test('Test 3 - Should pass', () => {
    expect(['apple', 'banana']).toContain('apple');
  });

  test('Test 4 - Should fail', () => {
    const obj: any = undefined;
    expect(obj.property).toBe('value'); // Will fail: Cannot read property of undefined
  });

  test.skip('Test 5 - Should skip', () => {
    expect(false).toBe(true);
  });
});