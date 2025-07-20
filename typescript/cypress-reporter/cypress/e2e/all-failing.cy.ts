describe('All Failing Tests', () => {
  it('Test 1 - Should fail', () => {
    expect('actual').to.equal('expected'); // Will fail: Assertion error
  });

  it('Test 2 - Should fail', () => {
    const arr: number[] = null as any;
    expect(arr.length).to.equal(0); // Will fail: Type error - Cannot read property 'length' of null
  });

  it('Test 3 - Should fail', () => {
    cy.wait(1000);
    expect(true).to.be.true; // Will fail: Timeout (if defaultCommandTimeout < 1000)
  });
});