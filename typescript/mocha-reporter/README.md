# Mocha LLM Reporter

An LLM-optimized reporter for Mocha that reduces output noise by 70%+ while ensuring zero missed failures.

## Installation

```bash
npm install --save-dev @llm-reporters/mocha-reporter
```

## Configuration

### Using Mocha Config File

```javascript
// .mocharc.js
module.exports = {
  reporter: '@llm-reporters/mocha-reporter',
  'reporter-options': {
    mode: 'summary',              // 'summary' or 'detailed'
    outputFile: './llm-test-results.md',
    includePassedTests: false,
    maxValueLength: 100,
    stackTraceLines: 0,
    detectPatterns: false
  }
};
```

### Using Command Line

```bash
# Summary mode (default)
mocha --reporter @llm-reporters/mocha-reporter

# Detailed mode
mocha --reporter @llm-reporters/mocha-reporter --reporter-options mode=detailed

# Save to file
mocha --reporter @llm-reporters/mocha-reporter --reporter-options outputFile=./results.md
```

### Using Environment Variables

```bash
# Set output mode
export LLM_OUTPUT_MODE=detailed

# Set output file
export LLM_OUTPUT_FILE=./test-results.md

# Run tests
npm test
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
| `detectPatterns` | `boolean` | `false` | Enable pattern detection (detailed mode) |

## Output Format

### Summary Mode

Provides minimal output focused on failures:
- Test failure summary per suite
- Brief error messages
- Overall statistics

### Detailed Mode

Includes comprehensive failure information:
- Full error context with code snippets
- Error classification and patterns
- Expected vs received values
- Actionable fix suggestions

## Example Usage

```javascript
// package.json
{
  "scripts": {
    "test": "mocha --reporter @llm-reporters/mocha-reporter",
    "test:detailed": "mocha --reporter @llm-reporters/mocha-reporter --reporter-options mode=detailed",
    "test:ci": "mocha --reporter @llm-reporters/mocha-reporter --reporter-options outputFile=./test-results.md"
  }
}
```

## Mocha-Specific Features

The reporter handles all Mocha test types:
- Synchronous tests
- Promise-based tests
- Callback-based tests (done)
- Async/await tests
- Test hooks (before, after, beforeEach, afterEach)
- Nested describe blocks
- Skipped and pending tests
- Custom timeouts