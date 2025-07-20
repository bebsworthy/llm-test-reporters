# Playwright with LLM Test Reporter

This example shows how to configure Playwright to use the LLM-optimized test reporter.

## Installation

```bash
npm install --save-dev @llm-reporters/playwright-reporter
```

## Configuration

Create or update your `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['@llm-reporters/playwright-reporter', {
    mode: process.env.LLM_OUTPUT_MODE || 'summary',
    includePassedSuites: false,
    maxValueLength: 100,
    outputFile: process.env.LLM_OUTPUT_FILE
  }]],
  
  use: {
    headless: true,
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ]
});
```

## Usage

### Summary Mode (Default)
```bash
npx playwright test
```

### Detailed Mode
```bash
LLM_OUTPUT_MODE=detailed npx playwright test
```

### Output to File
```bash
LLM_OUTPUT_FILE=results.txt npx playwright test
```

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

SUITE: tests/auth.spec.ts
FAILED TESTS:
- chromium > auth.spec.ts > Authentication > should reject invalid credentials > chromium: expect(received).toBe(expected...
- chromium > auth.spec.ts > Authentication > should timeout on slow network > chromium: Test timeout of 5000ms exceeded.

---
## SUMMARY
- PASSED SUITES: 2
- FAILED SUITES: 1
- TOTAL TESTS: 10 (8 passed, 2 failed)
- DURATION: 3.45s
- EXIT CODE: 1
```