import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    baseUrl: 'https://example.com',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 4000,
    requestTimeout: 5000,
    responseTimeout: 5000
  },
  reporter: './dist/index.js',
  reporterOptions: {
    mode: process.env.LLM_OUTPUT_MODE || 'summary',
    includePassedSuites: false,
    maxValueLength: 100
  }
});