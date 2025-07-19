# LLM-Optimized Test Reporters

A collection of test reporters optimized for LLM context efficiency. Stop missing test failures due to verbose output!

## Problem

Default test reporters output excessive information that overwhelms LLM context windows, causing them to miss critical test failures. This leads to incorrect code generation and wasted debugging time.

## Solution

Our reporters reduce output by 70%+ while preserving all essential failure information. Available in two modes:

- **Summary Mode**: Shows only failed test names for quick identification
- **Detailed Mode**: Includes actionable fix hints and minimal code context

## Quick Start

### Jest

```bash
npm install --save-dev @llm-reporters/jest
```

```json
// jest.config.js
module.exports = {
  reporters: ['@llm-reporters/jest']
};
```

### Vitest

```bash
npm install --save-dev @llm-reporters/vitest
```

```typescript
// vitest.config.ts
export default {
  reporters: ['@llm-reporters/vitest']
}
```

### Playwright

```bash
npm install --save-dev @llm-reporters/playwright
```

```typescript
// playwright.config.ts
export default {
  reporter: '@llm-reporters/playwright'
}
```

## Example Output

### Before (Default Jest Reporter)
```
FAIL  src/components/Button.test.ts
  ● Button › renders with correct styles

    expect(received).toHaveClass(expected)

    Expected: "btn btn-primary"
    Received: "btn"

      21 |   it('renders with correct styles', () => {
      22 |     const button = render(<Button primary>Click me</Button>);
    > 23 |     expect(button.container.firstChild).toHaveClass('btn btn-primary');
         |                                        ^
      24 |   });
      25 | 

    at Object.<anonymous> (src/components/Button.test.ts:23:40)
    at Promise.then.completed (node_modules/jest-circus/build/utils.js:298:28)
    ... [20 more lines of stack trace]

Test Suites: 1 failed, 3 passed, 4 total
Tests:       2 failed, 23 passed, 25 total
Snapshots:   0 total
Time:        2.341 s
Ran all test suites.
```

### After (LLM Reporter - Summary Mode)
```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: /src/components/Button.test.ts
FAILED TESTS:
- Button > renders with correct styles: Expected class "btn btn-primary" but received "btn"
- Button > handles click events when disabled: Expected onClick not to be called but was called 1 time

---
## SUMMARY
- PASSED SUITES: 3
- FAILED SUITES: 1
- TOTAL TESTS: 25 (23 passed, 2 failed)
- DURATION: 2.34s
- EXIT CODE: 1
```

70% reduction in tokens while preserving all critical information!

## Configuration

### Environment Variables

```bash
# Choose output mode
export LLM_REPORTER_MODE=detailed  # or 'summary' (default)

# Limit value length in detailed mode
export LLM_REPORTER_MAX_VALUE_LENGTH=200

# Output to file instead of stdout
export LLM_REPORTER_OUTPUT_FILE=test-results.txt
```

### Config File

Create `.llm-reporter.json`:

```json
{
  "mode": "summary",
  "detectPatterns": true,
  "maxValueLength": 200
}
```

## Supported Frameworks

### Currently Available
- 🟢 Jest (v26+)
- 🟢 Vitest (v0.34+)
- 🟢 Mocha (v9+)
- 🟢 Playwright (v1.38+)
- 🟢 Cypress (v12+)

### Coming Soon
- 🟡 PyTest (Python)
- 🟡 JUnit (Java)
- 🟡 Go test
- 🟡 RSpec (Ruby)
- 🟡 PHPUnit

## Why Use LLM-Optimized Reporters?

1. **Never Miss Failures**: Clear, concise output ensures LLMs catch every test failure
2. **Faster Development**: Less context usage means more room for code understanding
3. **Better Fix Suggestions**: Detailed mode provides actionable hints
4. **Universal Format**: Same output format across all testing frameworks
5. **Zero Config**: Works out of the box with sensible defaults

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT © 2024 LLM Test Reporters Team