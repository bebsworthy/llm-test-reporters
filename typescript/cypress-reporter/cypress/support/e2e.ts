// Cypress support file
// This file is processed and loaded automatically before your test files.

// Disable Cypress's default screenshot on failure behavior 
// since we want to control it for testing purposes
Cypress.Screenshot.defaults({
  screenshotOnRunFailure: false
});