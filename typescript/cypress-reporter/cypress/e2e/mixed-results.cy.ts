describe('Mixed Results', () => {
  it('Test 1 - Should pass', () => {
    expect(10).to.be.greaterThan(5);
  });

  it('Test 2 - Should fail', () => {
    expect(2 + 2).to.equal(5); // Will fail: Expected 5 but got 4
  });

  it('Test 3 - Should pass', () => {
    expect(['apple', 'banana']).to.include('apple');
  });

  it('Test 4 - Should fail', () => {
    const obj: any = undefined;
    expect(obj.property).to.equal('value'); // Will fail: Cannot read property of undefined
  });

  it.skip('Test 5 - Should skip', () => {
    expect(false).to.be.true;
  });
});