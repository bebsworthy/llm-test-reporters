const assert = require('assert');

describe('Mixed Results', function() {
  it('Test 1 - Should pass', function() {
    assert.strictEqual(10 > 5, true);
  });

  it('Test 2 - Should fail', function() {
    assert.strictEqual(2 + 2, 5, 'Expected 5 but got 4');
  });

  it('Test 3 - Should pass', function() {
    assert.strictEqual(['apple', 'banana'].includes('apple'), true);
  });

  it('Test 4 - Should fail', function() {
    const obj = undefined;
    assert.strictEqual(obj.property, 'value'); // Will fail: Cannot read property of undefined
  });

  it.skip('Test 5 - Should skip', function() {
    assert.strictEqual(false, true);
  });
});