# Mocha with LLM Test Reporter

This example shows how to configure Mocha to use the LLM-optimized test reporter.

## Installation

```bash
npm install --save-dev @llm-reporters/mocha-reporter
```

## Configuration

### Using .mocharc.json

```json
{
  "reporter": "@llm-reporters/mocha-reporter",
  "reporter-options": {
    "mode": "summary",
    "includePassedSuites": false,
    "maxValueLength": 100
  }
}
```

### Using Command Line

```bash
mocha --reporter @llm-reporters/mocha-reporter --reporter-options mode=summary,maxValueLength=100
```

### Using mocha.opts (deprecated but still supported)

```
--reporter @llm-reporters/mocha-reporter
--reporter-options mode=summary,includePassedSuites=false
```

## Usage

### Summary Mode (Default)
```bash
npm test
```

### Detailed Mode
```bash
LLM_OUTPUT_MODE=detailed npm test
```

### Output to File
```bash
LLM_OUTPUT_FILE=results.txt npm test
```

## Configuration Options

- **mode**: `'summary'` | `'detailed'` - Output verbosity level
- **includePassedSuites**: `boolean` - Include passed test suites in output (default: false)
- **maxValueLength**: `number` - Maximum length for assertion values (default: 100)
- **outputFile**: `string` - File path to write output (optional)
- **stackTraceLines**: `number` - Number of stack trace lines in detailed mode (default: 5)
- **detectPatterns**: `boolean` - Enable error pattern detection (default: true)

## Environment Variables

- `LLM_OUTPUT_MODE` or `LLM_REPORTER_MODE` - Set output mode (summary/detailed)
- `LLM_OUTPUT_FILE` - Set output file path
- `LLM_INCLUDE_PASSED_SUITES` - Include passed suites (true/false)

## Example Output

### Summary Mode
```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: test/auth.test.js
FAILED TESTS:
- Authentication > should reject invalid credentials: Expected values to be strictly equal:
- Authentication > should timeout after 5 seconds: Timeout of 5000ms exceeded

---
## SUMMARY
- PASSED SUITES: 2
- FAILED SUITES: 1
- TOTAL TESTS: 12 (10 passed, 2 failed)
- DURATION: 2.34s
- EXIT CODE: 1
```