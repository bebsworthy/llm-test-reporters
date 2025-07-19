# Vitest LLM Reporter

LLM-optimized test reporter for Vitest that reduces output noise by 70%+ while ensuring zero missed test failures.

## Installation

```bash
npm install --save-dev @llm-reporters/vitest-reporter
```

## Usage

### Configuration

Add the reporter to your `vitest.config.ts`:

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

### Environment Variables

Configure via environment variables:

```bash
LLM_REPORTER_MODE=detailed vitest run
LLM_REPORTER_OUTPUT_FILE=results.txt vitest run
```

### Configuration Options

```typescript
{
  mode: 'summary' | 'detailed',    // Output verbosity
  detectPatterns: boolean,          // Pattern detection in detailed mode
  maxValueLength: number,           // Max length for values
  stackTraceLines: number,          // Stack trace lines (0 = none)
  outputFile: string | null,        // Output file path
  includePassedSuites: boolean      // Include passed suites
}
```

## Output Modes

### Summary Mode

Minimal output for quick failure identification:

```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: tests/math.test.ts
FAILED TESTS:
- Calculator > addition > should handle negative numbers: expect(received).toBe(expected)
- Calculator > division > should throw on divide by zero: expect(received).toThrow()

---
## SUMMARY
- PASSED SUITES: 2
- FAILED SUITES: 1
- TOTAL TESTS: 15 (13 passed, 2 failed)
- DURATION: 0.45s
- EXIT CODE: 1
```

### Detailed Mode

Rich context for debugging with LLMs:

```
# LLM TEST REPORTER - DETAILED MODE

## TEST FAILURE #1
SUITE: Calculator
TEST: Calculator > addition > should handle negative numbers
FILE: tests/math.test.ts:38
TYPE: Assertion Error

EXPECTED: 0
RECEIVED: 2

CODE CONTEXT:
  36 |     it('should handle negative numbers', () => {
  37 |       // This will fail due to the bug
> 38 |       expect(calc.add(-1, 1)).toBe(0);
     |                               ^
  39 |     });

FAILURE REASON: calc.add(-1, 1) returned 2 instead of expected 0
```

## Vitest-Specific Features

The reporter handles Vitest-specific features:

- **Concurrent Tests**: Properly reports concurrent test failures
- **Test.each**: Formats parameterized test names
- **Snapshots**: Reports snapshot mismatches clearly
- **Extended Matchers**: Handles Vitest's custom matchers
- **Mocking**: Reports mock-related failures

## Configuration Examples

### For Development

```typescript
{
  mode: 'detailed',
  detectPatterns: true,
  stackTraceLines: 3
}
```

### For CI/CD

```typescript
{
  mode: 'summary',
  outputFile: './test-results.txt',
  maxValueLength: 100
}
```

### For LLM Analysis

```typescript
{
  mode: 'detailed',
  detectPatterns: true,
  stackTraceLines: 0,  // LLMs don't need stack traces
  maxValueLength: 150
}
```

## Integration with Vitest Features

### Watch Mode

The reporter works with Vitest's watch mode but is optimized for single runs:

```bash
# Recommended for LLM analysis
vitest run

# Works but may produce duplicate output
vitest watch
```

### Coverage

Compatible with coverage reporting:

```typescript
export default defineConfig({
  test: {
    reporters: [new VitestLLMReporter()],
    coverage: {
      reporter: ['text', 'lcov']
    }
  }
});
```

## Differences from Jest Reporter

- Uses Vitest's reporter interface
- Handles Vitest-specific matchers and features
- Supports concurrent test execution
- Compatible with Vitest's configuration system

## Performance

- **Overhead**: <50ms for 1000 tests
- **Output Reduction**: 70%+ compared to default reporter
- **Memory Usage**: Minimal, streams output

## License

MIT