import { describe, it, expect, beforeEach } from 'vitest';

class Calculator {
  add(a: number, b: number): number {
    // Bug: doesn't handle negative numbers correctly
    return Math.abs(a) + Math.abs(b);
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  divide(a: number, b: number): number {
    // Bug: doesn't throw on divide by zero
    return a / b;
  }

  factorial(n: number): number {
    if (n < 0) {
      throw new Error('Factorial of negative number');
    }
    if (n === 0 || n === 1) {
      return 1;
    }
    return n * this.factorial(n - 1);
  }
}

describe('Calculator', () => {
  let calc: Calculator;

  beforeEach(() => {
    calc = new Calculator();
  });

  describe('addition', () => {
    it('should add two positive numbers', () => {
      expect(calc.add(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      // This will fail due to the bug
      expect(calc.add(-1, 1)).toBe(0);
    });

    it('should handle zero', () => {
      expect(calc.add(0, 5)).toBe(5);
    });
  });

  describe('division', () => {
    it('should divide two numbers', () => {
      expect(calc.divide(10, 2)).toBe(5);
    });

    it('should throw on divide by zero', () => {
      // This will fail - doesn't throw
      expect(() => calc.divide(10, 0)).toThrow();
    });
  });

  describe('factorial', () => {
    it('should calculate factorial of 5', () => {
      expect(calc.factorial(5)).toBe(120);
    });

    it('should handle zero', () => {
      expect(calc.factorial(0)).toBe(1);
    });

    it('should throw for negative numbers', () => {
      expect(() => calc.factorial(-1)).toThrow('Factorial of negative number');
    });
  });
});