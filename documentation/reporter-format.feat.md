# LLM-Optimized Test Reporter Format Specification

## Overview

This specification defines the unified output format for all test reporters in this project. The format is designed to minimize LLM context usage while maximizing the ability to identify and fix test failures. All language and framework-specific reporters must conform to this exact format.

## Architecture

### Technology Stack

- **Output Format**: Plain text with markdown formatting
- **Encoding**: UTF-8 without BOM
- **Line Endings**: Unix-style (LF)
- **Streaming**: Line-buffered output support
- **Configuration**: Environment variables and JSON config files

### Key Components

- **FormatEngine**: Core formatting logic shared across all reporters
- **OutputMode**: Enum for summary/detailed mode selection
- **ErrorClassifier**: Categorizes errors into types
- **PatternDetector**: Identifies common failure patterns
- **CodeContextExtractor**: Extracts relevant code snippets

## Output Formats

### Summary Mode

```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: {absolute_file_path}
FAILED TESTS:
- {test_hierarchy} > {test_name}: {error_first_line}
- {test_hierarchy} > {test_name}: {error_first_line}

---
SUITE: {absolute_file_path}
FAILED TESTS:
- {test_hierarchy} > {test_name}: {error_first_line}

---
## SUMMARY
- PASSED SUITES: {number}
- FAILED SUITES: {number}
- TOTAL TESTS: {number} ({passed} passed, {failed} failed)
- DURATION: {seconds}s
- EXIT CODE: {0|1}
```

**Rules:**
- Only show suites with failures
- Use markdown horizontal rules (`---`) between suites
- Test hierarchy uses ` > ` as separator
- Error first line is truncated at 80 characters with "..." if needed
- Remove "Error:" prefix from error messages if present
- No ANSI colors or special characters
- Duration in seconds with 2 decimal places

### Detailed Mode

```
# LLM TEST REPORTER - DETAILED MODE

## TEST FAILURE #{number}
SUITE: {suite_name}
TEST: {test_hierarchy} > {test_name}
FILE: {absolute_file_path}:{line_number}
TYPE: {error_type}

EXPECTED: {expected_value}
RECEIVED: {received_value}

CODE CONTEXT:
  {line-2} | {code}
  {line-1} | {code}
> {line}   | {code}
     |{pointer}^
  {line+1} | {code}
  {line+2} | {code}

FAILURE REASON: {brief_explanation}
FIX HINT: {actionable_suggestion}

## TEST FAILURE #{number}
[... continues for each failure ...]

---
## ERROR PATTERNS DETECTED
- {count} tests failed due to {pattern_description}
- {count} tests failed due to {pattern_description}

## SUGGESTED FOCUS AREAS
1. {area_description}
2. {area_description}

---
## SUMMARY
- TOTAL TESTS: {number} ({passed} passed, {failed} failed)
- FAILURE RATE: {percentage}%
- DURATION: {seconds}s
- EXIT CODE: {0|1}
```

**Rules:**
- Show all failures in order of occurrence
- Code context shows 2 lines before/after error
- Pointer alignment must match exact column
- Error types: Assertion Error, Type Error, Reference Error, Timeout, Test Setup Error, Test Teardown Error
- Fix hints should be actionable and specific
- Pattern detection requires minimum 2 occurrences

## Error Type Classification

### Assertion Error
- Test expectations that fail
- Format: `EXPECTED: {value}` and `RECEIVED: {value}`
- Show actual vs expected values clearly

### Type Error
- Type-related failures
- Include the specific type mismatch
- Show stack trace excerpt if helpful

### Reference Error
- Undefined variables or properties
- Include the missing reference name
- Suggest common causes

### Timeout
- Tests exceeding time limits
- Show configured timeout value
- Include last operation if available

### Test Setup Error
- beforeEach/beforeAll failures
- Include setup function name
- Show initialization errors

### Test Teardown Error
- afterEach/afterAll failures
- Include cleanup function name
- Show resource cleanup errors

## Configuration

### Environment Variables

```bash
# Output mode: summary or detailed (default: summary)
LLM_REPORTER_MODE=summary|detailed

# Maximum characters per value in detailed mode (default: 200)
LLM_REPORTER_MAX_VALUE_LENGTH=200

# Maximum lines of stack trace (default: 0)
LLM_REPORTER_STACK_TRACE_LINES=0

# Enable pattern detection (default: true)
LLM_REPORTER_DETECT_PATTERNS=true|false

# Output file path (default: stdout)
LLM_REPORTER_OUTPUT_FILE=/path/to/output.txt
```

### Configuration File

`.llm-reporter.json`:
```json
{
  "mode": "summary",
  "maxValueLength": 200,
  "stackTraceLines": 0,
  "detectPatterns": true,
  "outputFile": null,
  "includePassedSuites": false,
  "frameworkOptions": {
    "jest": {
      "includeSnapshotDetails": false
    },
    "playwright": {
      "includeTraceLinks": false
    }
  }
}
```

## Implementation Requirements

### Performance
- Must add <100ms overhead for 1000 tests
- Stream output without buffering entire result
- Minimize memory usage for large test suites

### Compatibility
- Support Node.js 16+
- Work with default test runner configurations
- Not break existing reporter chains

### Extensibility
- Allow framework-specific extensions
- Support custom error classifiers
- Enable plugin architecture for patterns

## Validation

Each reporter implementation must pass:

1. **Format Compliance**: Output matches specification exactly
2. **Streaming Test**: Output appears during test run, not after
3. **Large Suite Test**: Handle 10,000+ tests efficiently
4. **Error Coverage**: Correctly classify all error types
5. **Configuration Test**: Respect all configuration options
6. **Cross-Framework Test**: Identical output for same test scenarios

## Examples

### Example Test File Structure

```typescript
describe('Calculator', () => {
  describe('addition', () => {
    it('should add two numbers', () => {
      expect(add(2, 2)).toBe(4);
    });
    
    it('should handle negative numbers', () => {
      expect(add(-1, 1)).toBe(0);
    });
  });
  
  describe('division', () => {
    it('should divide two numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });
    
    it('should throw on divide by zero', () => {
      expect(() => divide(10, 0)).toThrow('Division by zero');
    });
  });
});
```

### Example Summary Output

```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: /src/calculator.test.ts
FAILED TESTS:
- Calculator > addition > should handle negative numbers: Expected 0 but received -2
- Calculator > division > should throw on divide by zero: Expected function to throw 'Division by zero'

---
## SUMMARY
- PASSED SUITES: 3
- FAILED SUITES: 1
- TOTAL TESTS: 25 (23 passed, 2 failed)
- DURATION: 1.23s
- EXIT CODE: 1
```

### Example Detailed Output (First Failure Only)

```
# LLM TEST REPORTER - DETAILED MODE

## TEST FAILURE #1
SUITE: Calculator Tests
TEST: Calculator > addition > should handle negative numbers
FILE: /src/calculator.test.ts:8
TYPE: Assertion Error

EXPECTED: 0
RECEIVED: -2

CODE CONTEXT:
  6 |     
  7 |     it('should handle negative numbers', () => {
> 8 |       expect(add(-1, 1)).toBe(0);
    |                          ^
  9 |     });
  10 |   });

FAILURE REASON: add(-1, 1) returned -2 instead of expected 0
FIX HINT: Check the add function implementation for handling negative numbers correctly
```

## Testing

Tests to validate reporter implementations:

1. **Simple Failure**: Single test failure
2. **Multiple Failures**: Multiple tests failing in same suite
3. **Cross-Suite Failures**: Failures across different test files
4. **Error Types**: Each error type classification
5. **Long Output**: Values exceeding truncation limits
6. **Special Characters**: Unicode, newlines, quotes in test names
7. **Async Failures**: Promise rejections, timeout errors
8. **Setup/Teardown**: Lifecycle hook failures
9. **Nested Describes**: Deep test hierarchy
10. **Performance**: Large test suite execution time