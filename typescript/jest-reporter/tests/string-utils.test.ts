/**
 * Additional test suite to show multiple file failures
 */

import { describe, it, expect } from '@jest/globals';

describe('String Utils', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      const result = capitalize('hello');
      expect(result).toBe('Hello'); // Will fail - function not implemented correctly
    });

    it('should handle empty string', () => {
      const result = capitalize('');
      expect(result).toBe(''); // Will fail with type error
    });

    it('should handle already capitalized', () => {
      const result = capitalize('HELLO');
      expect(result).toBe('HELLO');
    });
  });

  describe('trim', () => {
    it('should remove whitespace', () => {
      const result = trim('  hello  ');
      expect(result).toBe('hello');
    });
  });
});

// Buggy implementations for demo
function capitalize(str: string): string {
  // Bug: returns lowercase instead of capitalized
  return str.toLowerCase();
}

function trim(str: string): string {
  return str.trim();
}