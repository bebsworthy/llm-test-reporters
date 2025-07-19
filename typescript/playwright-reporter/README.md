# Playwright LLM Reporter

An LLM-optimized reporter for Playwright Test that reduces output noise by 70%+ while ensuring zero missed failures.

## Installation

```bash
npm install --save-dev @llm-reporters/playwright-reporter
```

## Configuration

### Using Playwright Config File

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [['@llm-reporters/playwright-reporter', {
    mode: 'summary',              // 'summary' or 'detailed'
    outputFile: './llm-test-results.md',
    includePassedTests: false,
    maxValueLength: 100,
    stackTraceLines: 0
  }]]
});
```

### Using Command Line

```bash
# Summary mode (default)
npx playwright test --reporter=@llm-reporters/playwright-reporter

# With custom options
npx playwright test --reporter=@llm-reporters/playwright-reporter,mode=detailed,outputFile=results.md
```

### Using Environment Variables

```bash
# Set output mode
export LLM_OUTPUT_MODE=detailed

# Set output file
export LLM_OUTPUT_FILE=./test-results.md

# Run tests
npx playwright test
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'summary' \| 'detailed'` | `'summary'` | Output verbosity level |
| `outputFile` | `string` | `undefined` | File path to save results |
| `includePassedTests` | `boolean` | `false` | Include passed tests in output |
| `includePassedSuites` | `boolean` | `false` | Include suites with no failures |
| `maxValueLength` | `number` | `100` | Max length for expected/received values |
| `stackTraceLines` | `number` | `0` | Number of stack trace lines to include |

## Output Format

### Summary Mode

Provides minimal output focused on failures:
- Test failure summary per file
- Brief error messages with browser context
- Screenshot/trace/video paths when available
- Overall statistics

### Detailed Mode

Includes comprehensive failure information:
- Full error context with code snippets
- Browser and viewport information
- Network request details for API failures
- Screenshot, trace, and video paths
- Actionable fix suggestions

## Example Usage

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on-first-retry'
  },
  
  reporter: [
    ['@llm-reporters/playwright-reporter', {
      mode: 'summary',
      outputFile: process.env.CI ? './test-results.md' : undefined
    }]
  ],
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
```

## E2E-Specific Features

The reporter provides enhanced information for E2E tests:

### Browser Context
- Browser name included in test results
- Project name for multi-browser testing
- Device emulation details when applicable

### Test Artifacts
- **Screenshots**: Path included when `screenshot: 'on'` or `'only-on-failure'`
- **Traces**: Path included when `trace: 'on'` or similar
- **Videos**: Path included when `video: 'on'` or similar

### Enhanced Error Messages
- Element selector information for locator failures
- Network request details for API test failures
- Navigation errors with URL and status codes
- Timeout context with specific timeout values

### Example Output

```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: tests/navigation.spec.ts
FAILED TESTS:
- Navigation > should load homepage > chromium: TimeoutError: page.goto: Timeout 3000ms exceeded
- Navigation > should load homepage > firefox: Error: net::ERR_NAME_NOT_RESOLVED

---
SUITE: tests/interactions.spec.ts
FAILED TESTS:
- Interactions > should click button > webkit: Error: locator.click: element not found: button#submit
  Screenshot: test-results/interactions-click-button-webkit/screenshot.png

---
## SUMMARY
- PASSED SUITES: 1
- FAILED SUITES: 2
- TOTAL TESTS: 30 (27 passed, 3 failed)
- DURATION: 15.34s
- EXIT CODE: 1
```

## Multi-Project Support

The reporter handles Playwright's project feature, including browser name in the test hierarchy when multiple projects are configured.

## Performance Considerations

- Minimal overhead (<100ms for 1000 tests)
- Streaming output support
- Efficient memory usage for large test suites