const assert = require('assert');

describe('All Failing Tests', function() {
  it('Test 1 - Should fail', function() {
    assert.strictEqual('actual', 'expected'); // Will fail: Assertion error
  });

  it('Test 2 - Should fail', function() {
    const arr = null;
    assert.strictEqual(arr.length, 0); // Will fail: Type error - Cannot read property 'length' of null
  });

  it('Test 3 - Should fail', async function() {
    this.timeout(500);
    await new Promise(resolve => setTimeout(resolve, 1000));
    assert.strictEqual(true, true); // Will fail: Timeout
  });
});