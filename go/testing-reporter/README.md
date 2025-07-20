# Go LLM Test Reporter

LLM-optimized test reporter for Go's built-in testing package.

## Installation

```bash
go install github.com/llm-reporters/go-testing-reporter@latest
```

Or build from source:

```bash
git clone https://github.com/llm-reporters/llm-test-reporters
cd go/testing-reporter
go build -o llm-go-test .
```

## Usage

### As a wrapper command

```bash
# Run all tests in current directory
llm-go-test

# Run tests in specific package
llm-go-test ./pkg/...

# Run in detailed mode
llm-go-test -mode detailed ./...

# Output to file
llm-go-test -output test-results.txt ./...

# Pass flags to go test
llm-go-test -v -race ./...
```

### With piped input

```bash
# Pipe go test JSON output
go test -json ./... | llm-go-test

# With custom mode
go test -json ./... | llm-go-test -mode detailed
```

### Environment Variables

- `LLM_OUTPUT_MODE`: Set output mode (`summary` or `detailed`)
- `LLM_OUTPUT_FILE`: Set output file path

```bash
export LLM_OUTPUT_MODE=detailed
llm-go-test ./...
```

## Output Modes

### Summary Mode (Default)

Shows only failed tests with truncated error messages:

```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: github.com/example/mypackage
FAILED TESTS:
- TestFunction: Expected 10 but got 5
- TestTimeout: test timed out after 100ms

---
## SUMMARY
- PASSED SUITES: 0
- FAILED SUITES: 1
- TOTAL TESTS: 10 (8 passed, 2 failed)
- DURATION: 1.23s
- EXIT CODE: 1
```

### Detailed Mode

Provides comprehensive failure information:

```
# LLM TEST REPORTER - DETAILED MODE

## TEST FAILURE #1
SUITE: github.com/example/mypackage
TEST: TestFunction
FILE: github.com/example/mypackage
TYPE: Assertion Error

FAILURE REASON: Expected 10 but got 5
FIX HINT: Review assertion logic and expected values

---
```

## Features

- Clean, LLM-optimized output format
- Automatic error classification
- Fix hints for common error types
- Support for subtests and table-driven tests
- Streaming output support
- Compatible with all go test flags

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Run tests with LLM reporter
  run: |
    go install github.com/llm-reporters/go-testing-reporter@latest
    llm-go-test -mode detailed -output test-results.txt ./...
    
- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results.txt
```

### GitLab CI

```yaml
test:
  script:
    - go install github.com/llm-reporters/go-testing-reporter@latest
    - llm-go-test -output test-results.txt ./...
  artifacts:
    when: on_failure
    paths:
      - test-results.txt
```

## Error Classification

The reporter automatically classifies errors:

- **Assertion Error**: Test assertion failures
- **Nil Pointer**: Nil pointer dereferences
- **Index Error**: Array/slice index out of bounds
- **Type Error**: Type conversion failures
- **Timeout**: Test timeouts
- **Panic**: Runtime panics

Each error type comes with specific fix hints to help resolve issues quickly.

## Development

To contribute or modify the reporter:

```bash
# Clone the repository
git clone https://github.com/llm-reporters/llm-test-reporters
cd go/testing-reporter

# Install dependencies
go mod download

# Run tests
go test ./...

# Build
go build -o llm-go-test .
```

## License

MIT License - see LICENSE file for details.