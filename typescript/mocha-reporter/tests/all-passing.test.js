const assert = require('assert');

describe('All Passing Tests', function() {
  it('Test 1 - Should pass', function() {
    assert.strictEqual(1 + 1, 2);
  });

  it('Test 2 - Should pass', function() {
    assert.strictEqual('hello world'.includes('world'), true);
  });

  it('Test 3 - Should pass', function() {
    assert.strictEqual(true, true);
  });
});