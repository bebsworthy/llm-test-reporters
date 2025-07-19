import { test, expect } from '@playwright/test';

test.describe('Validation Tests', () => {
  test('should pass basic assertion', async () => {
    expect(1 + 1).toBe(2);
    expect('hello').toContain('ell');
    expect(true).toBeTruthy();
  });

  test('should fail number comparison', async () => {
    expect(2 + 2).toBe(5);
  });

  test('should fail string assertion', async () => {
    expect('Hello World').toBe('Goodbye World');
  });

  test('should handle array comparison', async () => {
    expect([1, 2, 3]).toEqual([1, 2, 4]);
  });

  test('should fail on object property', async () => {
    const obj = { name: 'John', age: 30 };
    expect(obj.age).toBe(25);
  });

  test.skip('should skip this test', async () => {
    expect(1).toBe(2);
  });
});