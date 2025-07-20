describe('All Passing Tests', () => {
  it('Test 1 - Should pass', () => {
    expect(1 + 1).to.equal(2);
  });

  it('Test 2 - Should pass', () => {
    expect('hello world').to.include('world');
  });

  it('Test 3 - Should pass', () => {
    expect(true).to.be.true;
  });
});