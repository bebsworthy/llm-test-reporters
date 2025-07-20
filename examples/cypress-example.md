# Cypress with LLM Test Reporter

This example shows how to configure Cypress to use the LLM-optimized test reporter.

## Installation

```bash
npm install --save-dev @llm-test-reporter/cypress
```

## Configuration

Create or update your `cypress.config.ts`:

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.ts',
    baseUrl: 'https://example.com',
    video: false,
    screenshotOnRunFailure: false
  },
  reporter: '@llm-test-reporter/cypress',
  reporterOptions: {
    mode: process.env.LLM_OUTPUT_MODE || 'summary',
    includePassedSuites: false,
    maxValueLength: 100,
    outputFile: process.env.LLM_OUTPUT_FILE
  }
});
```

## Usage

### Summary Mode (Default)
```bash
npx cypress run
```

### Detailed Mode
```bash
LLM_OUTPUT_MODE=detailed npx cypress run
```

### Output to File
```bash
LLM_OUTPUT_FILE=results.txt npx cypress run
```

## Handling Multiple Spec Files

Cypress runs each spec file in a separate process, which creates multiple reporter outputs. The LLM reporter automatically aggregates these into a single unified report using a post-processing step.

## Configuration Options

- **mode**: `'summary'` | `'detailed'` - Output verbosity level
- **includePassedSuites**: `boolean` - Include passed test suites in output (default: false)
- **maxValueLength**: `number` - Maximum length for assertion values (default: 100)
- **outputFile**: `string` - File path to write output (optional)
- **stackTraceLines**: `number` - Number of stack trace lines in detailed mode (default: 5)
- **detectPatterns**: `boolean` - Enable error pattern detection (default: true)

## Environment Variables

- `LLM_OUTPUT_MODE` - Set output mode (summary/detailed)
- `LLM_OUTPUT_FILE` - Set output file path
- `LLM_INCLUDE_PASSED_SUITES` - Include passed suites (true/false)

## Example Output

### Summary Mode
```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: cypress/e2e/auth.cy.ts
FAILED TESTS:
- Login > should reject invalid credentials: expected 'Login failed' to equal 'Welcome'
- Login > should handle network errors: Network request failed

---
## SUMMARY
- PASSED SUITES: 3
- FAILED SUITES: 1
- TOTAL TESTS: 15 (13 passed, 2 failed)
- DURATION: 8.23s
- EXIT CODE: 1
```

## Notes

- The reporter uses JSON intermediate format for aggregation across multiple spec files
- Ensure `--quiet` flag or `quiet: true` config to reduce Cypress's default output
- The aggregation happens automatically after all specs complete