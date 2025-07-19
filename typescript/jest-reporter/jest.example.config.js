/**
 * Example Jest configuration showing different reporter modes
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  reporters: [
    ['./dist/index.js', {
      mode: process.env.LLM_REPORTER_MODE || 'summary',
      detectPatterns: true,
      outputFile: process.env.LLM_REPORTER_OUTPUT_FILE
    }]
  ]
};