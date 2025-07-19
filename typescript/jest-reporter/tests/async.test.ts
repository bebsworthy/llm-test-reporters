/**
 * Test suite to demonstrate async and timeout errors
 */

import { describe, it, expect } from '@jest/globals';

describe('Async Operations', () => {
  it('should complete quickly', async () => {
    const result = await fastOperation();
    expect(result).toBe('done');
  });

  it('should timeout on slow operation', async () => {
    // This will timeout - intentionally taking longer than test timeout
    const result = await slowOperation();
    expect(result).toBe('done');
  }, 500); // 500ms timeout, but operation takes 600ms

  it('should handle promise rejection', async () => {
    await expect(failingOperation()).rejects.toThrow('Network error');
    // Will fail - wrong error message
  });
});

// Test implementations
async function fastOperation(): Promise<string> {
  return new Promise(resolve => {
    setTimeout(() => resolve('done'), 100);
  });
}

async function slowOperation(): Promise<string> {
  return new Promise(resolve => {
    // Takes 600ms but test has 500ms timeout
    setTimeout(() => resolve('done'), 600);
  });
}

async function failingOperation(): Promise<string> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Connection failed')), 100);
  });
}