const assert = require('assert');

describe('Async Operations', function() {
  describe('Promises', function() {
    it('should resolve successfully', function() {
      return Promise.resolve(42).then(value => {
        assert.strictEqual(value, 42);
      });
    });

    it('should reject with error', function() {
      return Promise.reject(new Error('Promise rejection')).then(
        () => assert.fail('Should not resolve'),
        err => assert.strictEqual(err.message, 'Wrong message')
      );
    });

    it('should timeout on slow operation', function() {
      this.timeout(100);
      return new Promise(resolve => {
        setTimeout(resolve, 200);
      });
    });
  });

  describe('Callbacks', function() {
    it('should call done when complete', function(done) {
      setTimeout(() => {
        assert.strictEqual(1, 1);
        done();
      }, 10);
    });

    it('should fail with done error', function(done) {
      setTimeout(() => {
        done(new Error('Callback error'));
      }, 10);
    });

    it('should timeout without calling done', function(done) {
      this.timeout(50);
      // Never call done
    });
  });

  describe('Async/Await', function() {
    it('should work with async functions', async function() {
      const result = await Promise.resolve(10);
      assert.strictEqual(result, 10);
    });

    it('should handle async errors', async function() {
      async function failingFunction() {
        throw new Error('Async error');
      }
      await failingFunction();
    });

    it('should fail on assertion in async', async function() {
      await new Promise(resolve => setTimeout(resolve, 10));
      assert.strictEqual('async', 'sync');
    });
  });
});