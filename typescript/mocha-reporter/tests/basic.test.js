const assert = require('assert');

describe('Basic Math Operations', function() {
  describe('Addition', function() {
    it('should add two positive numbers correctly', function() {
      assert.strictEqual(2 + 2, 4);
    });

    it('should handle negative numbers', function() {
      assert.strictEqual(-5 + 3, -2);
    });

    it('should fail on incorrect sum', function() {
      assert.strictEqual(2 + 2, 5, 'Math is broken!');
    });
  });

  describe('Division', function() {
    it('should divide positive numbers', function() {
      assert.strictEqual(10 / 2, 5);
    });

    it('should handle division by zero', function() {
      const result = 1 / 0;
      assert.strictEqual(result, Infinity);
    });

    it('should fail on incorrect division', function() {
      assert.strictEqual(10 / 2, 3, 'Expected 10/2 to equal 3');
    });
  });
});

describe('String Operations', function() {
  it('should concatenate strings', function() {
    assert.strictEqual('hello' + ' ' + 'world', 'hello world');
  });

  it('should fail on type error', function() {
    const obj = null;
    assert.strictEqual(obj.toString(), 'null');
  });

  it('should detect undefined property access', function() {
    const obj = {};
    assert.strictEqual(obj.nonExistent.nested, 'value');
  });
});