import { describe, test, expect } from 'vitest';

describe('All Passing Tests', () => {
  test('Test 1 - Should pass', () => {
    expect(1 + 1).toBe(2);
  });

  test('Test 2 - Should pass', () => {
    expect('hello world').toContain('world');
  });

  test('Test 3 - Should pass', () => {
    expect(true).toBeTruthy();
  });
});