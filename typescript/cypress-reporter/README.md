# @llm-test-reporter/cypress

LLM-optimized test reporter for Cypress that reduces output noise by 70%+ while ensuring zero missed failures.

## Installation

```bash
npm install --save-dev @llm-test-reporter/cypress
```

## Usage

### cypress.config.ts

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    reporter: '@llm-test-reporter/cypress',
    reporterOptions: {
      mode: 'summary', // or 'detailed'
      includePassedSuites: false,
      maxValueLength: 100,
      outputFile: 'test-results.txt' // optional
    }
  }
});
```

### Environment Variables

```bash
# Set output mode
LLM_OUTPUT_MODE=detailed cypress run

# Or use reporter options in config
```

## Output Modes

### Summary Mode (Default)
- Lists only failed tests with truncated error messages
- Groups failures by test file
- Includes total test counts and duration
- Perfect for quick CI/CD status checks

### Detailed Mode
- Shows full error messages and stack traces
- Includes code context around failures
- Captures Cypress command logs for failed tests
- Includes screenshot and video paths
- Better for debugging complex failures

## Features

- **E2E-Specific Output**: Captures browser info, screenshots, videos, and command logs
- **Minimal Noise**: 70%+ reduction in output size compared to default reporter
- **Zero Missed Failures**: Guaranteed to surface all test failures
- **Cypress Commands**: Shows relevant Cypress commands leading to failures
- **Cross-Browser Support**: Works with all Cypress-supported browsers
- **CI-Friendly**: Clean, parseable output format

## Output Format

```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: cypress/e2e/auth.cy.ts
FAILED TESTS:
- Login > should authenticate with valid credentials: cy.get() timed out waiting for element
- Login > should show error with invalid password: Expected to find element: '.error-message', but never found it

---
## SUMMARY
- PASSED SUITES: 2
- FAILED SUITES: 1
- TOTAL TESTS: 10 (7 passed, 3 failed)
- DURATION: 15.3s
- EXIT CODE: 1
```

## License

MIT