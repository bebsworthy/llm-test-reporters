# Vitest LLM Reporter Example

This example demonstrates how to use the LLM-optimized Vitest reporter.

## Setup

### 1. Install Dependencies

```bash
npm install --save-dev vitest @llm-reporters/vitest-reporter
```

### 2. Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import VitestLLMReporter from '@llm-reporters/vitest-reporter';

export default defineConfig({
  test: {
    reporters: [
      new VitestLLMReporter({
        mode: 'summary', // or 'detailed'
        detectPatterns: true,
        maxValueLength: 200
      })
    ]
  }
});
```

### 3. Configuration Options

Create `.llm-reporter.json` (optional):

```json
{
  "mode": "summary",
  "detectPatterns": true,
  "maxValueLength": 200,
  "stackTraceLines": 0,
  "outputFile": null,
  "includePassedSuites": false
}
```

## Environment Variables

```bash
# Set output mode
LLM_REPORTER_MODE=detailed npx vitest run

# Save to file
LLM_REPORTER_OUTPUT_FILE=results.txt npx vitest run

# Configure inline
LLM_REPORTER_MODE=detailed LLM_REPORTER_MAX_VALUE_LENGTH=100 npx vitest run
```

## Watch Mode

The reporter works with Vitest's watch mode but is optimized for single runs:

```bash
# Recommended for LLM analysis
npx vitest run

# Watch mode (may produce duplicate output)
npx vitest watch
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx vitest run
        env:
          LLM_REPORTER_MODE: summary
          LLM_REPORTER_OUTPUT_FILE: test-results.txt
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results.txt
```

## Advanced Configuration

### For Development
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    reporters: [
      new VitestLLMReporter({
        mode: 'detailed',
        detectPatterns: true,
        stackTraceLines: 3,
        maxValueLength: 300
      })
    ],
    testTimeout: 5000
  }
});
```

### For CI/CD
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    reporters: [
      new VitestLLMReporter({
        mode: 'summary',
        outputFile: process.env.CI ? './test-results.txt' : undefined,
        maxValueLength: 100,
        stackTraceLines: 0
      })
    ]
  }
});
```

### For LLM Analysis
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    reporters: [
      new VitestLLMReporter({
        mode: 'detailed',
        detectPatterns: true,
        stackTraceLines: 0,  // LLMs don't need stack traces
        maxValueLength: 150,
        outputFile: './llm-analysis.txt'
      })
    ]
  }
});
```

## Differences from Jest Reporter

1. **Configuration**: Uses Vitest's reporter interface (instantiate class vs array config)
2. **Import Style**: Supports both ESM and CJS (Vitest prefers ESM)
3. **Matchers**: Includes Vitest-specific matchers and better TypeScript support
4. **Performance**: Generally faster test execution with Vitest's architecture

## Tips

1. **Use Summary Mode** for quick CI/CD checks and initial failure scans
2. **Use Detailed Mode** when debugging specific failures or for LLM analysis
3. **Disable Stack Traces** when outputting for LLMs (they add noise without value)
4. **Enable Pattern Detection** to identify systemic issues across multiple tests
5. **Use Concurrent Tests** carefully - they may produce non-deterministic output order
6. **Type Safety**: Leverage TypeScript for better error messages and type checking