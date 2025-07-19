/**
 * Jest configuration for testing the reporter
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  reporters: [
    ['./dist/index.js', {
      mode: 'summary',
      detectPatterns: true
    }]
  ]
};