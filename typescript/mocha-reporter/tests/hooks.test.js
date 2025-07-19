const assert = require('assert');

describe('Test Hooks', function() {
  let sharedResource;

  before(function() {
    // This runs once before all tests
    sharedResource = { count: 0 };
  });

  beforeEach(function() {
    // This runs before each test
    sharedResource.count = 0;
  });

  afterEach(function() {
    // This runs after each test
    if (sharedResource.count > 5) {
      throw new Error('Resource count exceeded limit in afterEach');
    }
  });

  after(function() {
    // This runs once after all tests
    sharedResource = null;
  });

  it('should use shared resource', function() {
    sharedResource.count += 1;
    assert.strictEqual(sharedResource.count, 1);
  });

  it('should reset resource between tests', function() {
    assert.strictEqual(sharedResource.count, 0);
    sharedResource.count += 10; // This will cause afterEach to fail
  });

  it('should run even after hook failure', function() {
    assert.strictEqual(typeof sharedResource, 'object');
  });
});

describe('Hook Failures', function() {
  before(function() {
    throw new Error('Before hook failed');
  });

  it('should not run if before hook fails', function() {
    assert.fail('This test should not run');
  });
});

describe('Async Hooks', function() {
  let asyncData;

  before(async function() {
    await new Promise(resolve => setTimeout(resolve, 10));
    asyncData = 'loaded';
  });

  it('should have async data available', function() {
    assert.strictEqual(asyncData, 'loaded');
  });

  it('should fail in async beforeEach', function() {
    // This test will fail due to the beforeEach below
  });

  beforeEach(async function() {
    if (this.currentTest.title.includes('fail')) {
      throw new Error('Async beforeEach error');
    }
  });
});