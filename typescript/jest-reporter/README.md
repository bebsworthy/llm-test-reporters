# @llm-reporters/jest-reporter

LLM-optimized Jest test reporter that reduces output noise and highlights failures for AI analysis.

## Features

- **70%+ output reduction** compared to default Jest reporter
- **Zero missed failures** - all test failures are prominently displayed
- **Two output modes**: Summary (minimal) and Detailed (with code context)
- **Pattern detection** to identify common failure causes
- **Clean format** without ANSI codes or terminal-specific formatting
- **Streaming output** for real-time feedback

## Installation

```bash
npm install --save-dev @llm-reporters/jest-reporter
```

## Usage

### Basic Setup

Add to your `jest.config.js`:

```javascript
module.exports = {
  reporters: [
    ['@llm-reporters/jest-reporter', {
      mode: 'summary' // or 'detailed'
    }]
  ]
};
```

### Configuration Options

#### Via Reporter Config

```javascript
module.exports = {
  reporters: [
    ['@llm-reporters/jest-reporter', {
      mode: 'detailed',
      detectPatterns: true,
      outputFile: './test-results.txt',
      maxValueLength: 200,
      includeSnapshotDetails: false
    }]
  ]
};
```

#### Via Environment Variables

```bash
LLM_REPORTER_MODE=detailed npm test
LLM_REPORTER_OUTPUT_FILE=results.txt npm test
```

#### Via Configuration File

Create `.llm-reporter.json` in your project root:

```json
{
  "mode": "summary",
  "detectPatterns": true,
  "frameworkOptions": {
    "jest": {
      "includeSnapshotDetails": false,
      "groupByDescribe": true
    }
  }
}
```

## Output Examples

### Summary Mode

```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: /src/calculator.test.ts
FAILED TESTS:
- Calculator > addition > should handle negative numbers: Expected 0 but received -2
- Calculator > division > should throw on divide by zero: Expected function to throw

---
## SUMMARY
- PASSED SUITES: 2
- FAILED SUITES: 1
- TOTAL TESTS: 10 (8 passed, 2 failed)
- DURATION: 1.23s
- EXIT CODE: 1
```

### Detailed Mode

```
# LLM TEST REPORTER - DETAILED MODE

## TEST FAILURE #1
SUITE: Calculator
TEST: Calculator > addition > should handle negative numbers
FILE: /src/calculator.test.ts:12
TYPE: Assertion Error

EXPECTED: 0
RECEIVED: -2

CODE CONTEXT:
  10 |     it('should handle negative numbers', () => {
  11 |       const result = add(-1, 1);
> 12 |       expect(result).toBe(0);
     |                      ^
  13 |     });
  14 |   });

FAILURE REASON: add(-1, 1) returned -2 instead of expected 0
FIX HINT: Check the add function implementation for correct operation

---
## SUMMARY
- TOTAL TESTS: 10 (8 passed, 2 failed)
- FAILURE RATE: 20.00%
- DURATION: 1.23s
- EXIT CODE: 1
```

## Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'summary' \| 'detailed'` | `'summary'` | Output verbosity level |
| `detectPatterns` | `boolean` | `true` | Detect common failure patterns |
| `outputFile` | `string \| null` | `null` | Write output to file instead of console |
| `maxValueLength` | `number` | `200` | Maximum length for expected/received values |
| `includeSnapshotDetails` | `boolean` | `false` | Include snapshot diff details |
| `groupByDescribe` | `boolean` | `true` | Group tests by describe blocks |

## Integration with CI/CD

The reporter works seamlessly with CI systems:

```yaml
# GitHub Actions example
- name: Run tests
  run: npm test
  env:
    LLM_REPORTER_MODE: detailed
    LLM_REPORTER_OUTPUT_FILE: test-results.txt

- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results.txt
```

## Tips for LLM Usage

1. Use **summary mode** for quick failure identification
2. Switch to **detailed mode** when you need code context
3. Enable **pattern detection** to identify systemic issues
4. Configure **file output** to save results for later analysis

## License

MIT