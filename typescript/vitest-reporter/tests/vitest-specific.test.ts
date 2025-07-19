import { describe, it, expect, test, beforeAll, afterAll, vi } from 'vitest';

// Vitest-specific features
describe('Vitest Specific Features', () => {
  describe('Mocking', () => {
    it('should mock functions', () => {
      const mockFn = vi.fn(() => 42);
      expect(mockFn()).toBe(42);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should spy on methods', () => {
      const obj = {
        method: (x: number) => x * 2
      };
      
      const spy = vi.spyOn(obj, 'method');
      obj.method(5);
      
      // This will fail - wrong expectation
      expect(spy).toHaveBeenCalledWith(10);
    });
  });

  describe('Snapshots', () => {
    it('should match snapshot', () => {
      const data = {
        name: 'Test',
        value: 42,
        timestamp: Date.now() // This will fail - timestamp changes
      };
      
      expect(data).toMatchSnapshot();
    });
  });

  describe('Concurrent Tests', () => {
    test.concurrent('concurrent test 1', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(true).toBe(true);
    });

    test.concurrent('concurrent test 2', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      // This will fail
      expect(false).toBe(true);
    });
  });

  describe('Test Each', () => {
    test.each([
      [1, 1, 2],
      [1, 2, 3],
      [2, 2, 5], // This will fail
    ])('add(%i, %i) should return %i', (a, b, expected) => {
      expect(a + b).toBe(expected);
    });
  });

  describe('Extended Matchers', () => {
    it('should use toBeTypeOf', () => {
      const value: any = '42';
      // This will fail - value is string not number
      expect(value).toBeTypeOf('number');
    });

    it('should use toSatisfy', () => {
      const isEven = (n: number) => n % 2 === 0;
      // This will fail - 5 is not even
      expect(5).toSatisfy(isEven);
    });
  });
});