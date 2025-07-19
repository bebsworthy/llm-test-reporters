/**
 * Example test suite to demonstrate LLM Jest Reporter
 */

import { describe, it, expect } from '@jest/globals';

describe('Calculator', () => {
  describe('addition', () => {
    it('should add two positive numbers', () => {
      const result = add(2, 3);
      expect(result).toBe(5);
    });

    it('should handle negative numbers', () => {
      const result = add(-1, 1);
      expect(result).toBe(0); // This will fail - expecting 0 but will get -2
    });

    it('should handle zero', () => {
      const result = add(0, 0);
      expect(result).toBe(0);
    });
  });

  describe('division', () => {
    it('should divide two numbers', () => {
      const result = divide(10, 2);
      expect(result).toBe(5);
    });

    it('should throw on divide by zero', () => {
      expect(() => divide(10, 0)).toThrow('Division by zero');
      // This will fail - function doesn't throw
    });

    it('should handle decimal results', () => {
      const result = divide(7, 2);
      expect(result).toBe(3.5);
    });
  });
});

// Implementation (with intentional bugs for demo)
function add(a: number, b: number): number {
  // Bug: should be a + b
  return a - b;
}

function divide(a: number, b: number): number {
  // Bug: doesn't check for zero or throw error
  return a / b;
}