import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.ts', // Run all test files
    supportFile: 'cypress/support/e2e.ts',
    baseUrl: 'https://example.com',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: false,
    defaultCommandTimeout: 2000,
    requestTimeout: 3000,
    responseTimeout: 3000,
    // Faster test execution for validation
    watchForFileChanges: false,
    chromeWebSecurity: false,
    // Disable the default spec reporter output
    quiet: true
  },
  reporter: './dist/index.js',
  reporterOptions: {
    mode: process.env.LLM_OUTPUT_MODE || 'summary',
    includePassedSuites: false,
    maxValueLength: 100
  }
});