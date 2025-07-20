# Go Test Reporter Example

This guide shows how to use the LLM-optimized test reporter with Go's standard testing package.

## Installation

```bash
# Clone or download the reporter
git clone https://github.com/llm-reporters/go-testing-reporter.git
cd go-testing-reporter

# Build the reporter binary
go build -o llm-go-test .

# Or install globally
go install github.com/llm-reporters/go-testing-reporter@latest
```

## Basic Usage

### Using the Binary Wrapper

```bash
# Run tests with summary output (default)
./llm-go-test ./...

# Run tests with detailed output
./llm-go-test -mode detailed ./...

# Write output to file
./llm-go-test -output results.txt ./...

# Test specific package
./llm-go-test -mode detailed ./pkg/calculator
```

### Using with go test -json

```bash
# Pipe go test output to the reporter
go test -json ./... | llm-go-test

# With detailed mode
go test -json ./... | llm-go-test -mode detailed
```

### Environment Variables

```bash
# Set mode via environment
LLM_OUTPUT_MODE=detailed llm-go-test ./...

# Set output file via environment
LLM_OUTPUT_FILE=results.txt llm-go-test ./...
```

## Example Test File

```go
package calculator_test

import (
    "testing"
    "github.com/example/calculator"
)

func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive numbers", 2, 3, 5},
        {"negative numbers", -2, -3, -5},
        {"mixed numbers", -2, 3, 1},
        {"with zero", 0, 5, 5},
        {"overflow", 2147483647, 1, -2147483648}, // This will fail
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := calculator.Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d, want %d", 
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}

func TestDivide(t *testing.T) {
    result, err := calculator.Divide(10, 0)
    if err == nil {
        t.Errorf("Divide(10, 0) should return error, got %d", result)
    }
}

func TestComplexOperation(t *testing.T) {
    t.Run("should handle complex math", func(t *testing.T) {
        result := calculator.Complex(5, 3, 2)
        expected := 25 // (5 * 3) + (5 * 2)
        if result != expected {
            t.Errorf("Complex operation failed: got %d, want %d", result, expected)
        }
    })
}
```

## Example Output

### Summary Mode

```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: /home/user/project/calculator_test.go
FAILED TESTS:
- TestAdd > overflow: Add(2147483647, 1) = -2147483648, want -2147483648
- TestDivide: Divide(10, 0) should return error, got 0
- TestComplexOperation > should handle complex math: Complex operation failed: got 20, want 25

---
## SUMMARY
- PASSED SUITES: 0
- FAILED SUITES: 1
- TOTAL TESTS: 8 (5 passed, 3 failed)
- DURATION: 0.12s
- EXIT CODE: 1
```

### Detailed Mode

```
# LLM TEST REPORTER - DETAILED MODE

## TEST FAILURE #1
SUITE: /home/user/project/calculator_test.go
TEST: TestAdd > overflow
FILE: /home/user/project/calculator_test.go:28
TYPE: Assertion Error

FAILURE REASON: Add(2147483647, 1) = -2147483648, want -2147483648
FIX HINT: Review assertion logic and expected values

---
## TEST FAILURE #2
SUITE: /home/user/project/calculator_test.go
TEST: TestDivide
FILE: /home/user/project/calculator_test.go:35
TYPE: Error

FAILURE REASON: Divide(10, 0) should return error, got 0
FIX HINT: Review error message and stack trace for details

---
## TEST FAILURE #3
SUITE: /home/user/project/calculator_test.go
TEST: TestComplexOperation > should handle complex math
FILE: /home/user/project/calculator_test.go:44
TYPE: Error

FAILURE REASON: Complex operation failed: got 20, want 25
FIX HINT: Review error message and stack trace for details

---
## ERROR PATTERNS DETECTED
- 3 tests failed

---
---
## SUMMARY
- PASSED SUITES: 0
- FAILED SUITES: 1
- TOTAL TESTS: 8 (5 passed, 3 failed)
- DURATION: 0.12s
- EXIT CODE: 1
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Go Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.21'
    
    - name: Build test reporter
      run: |
        cd go/testing-reporter
        go build -o llm-go-test .
    
    - name: Run tests with LLM reporter
      run: |
        ./go/testing-reporter/llm-go-test -mode detailed -output results.txt ./...
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: results.txt
```

### GitLab CI

```yaml
test:
  stage: test
  script:
    - go build -o llm-go-test ./go/testing-reporter
    - ./llm-go-test -mode detailed -output results.txt ./...
  artifacts:
    when: always
    paths:
      - results.txt
    reports:
      junit: results.txt
```

## Working with Testify

The reporter works seamlessly with testify assertions:

```go
package calculator_test

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/suite"
    "github.com/example/calculator"
)

// Using testify assertions
func TestAddWithTestify(t *testing.T) {
    assert := assert.New(t)
    
    result := calculator.Add(2, 3)
    assert.Equal(5, result, "2 + 3 should equal 5")
    
    // This will fail and show in the reporter
    assert.Equal(10, calculator.Add(3, 3), "3 + 3 should equal 10")
}

// Using testify suite
type CalculatorTestSuite struct {
    suite.Suite
    calc *calculator.Calculator
}

func (suite *CalculatorTestSuite) SetupTest() {
    suite.calc = calculator.New()
}

func (suite *CalculatorTestSuite) TestMultiply() {
    result := suite.calc.Multiply(4, 5)
    suite.Equal(20, result)
}

func TestCalculatorSuite(t *testing.T) {
    suite.Run(t, new(CalculatorTestSuite))
}
```

## Advanced Features

### Running Specific Tests

```bash
# Run tests matching a pattern
llm-go-test -run TestAdd ./...

# Run tests in verbose mode (shows passing tests too)
llm-go-test -v ./...

# Run with timeout
llm-go-test -timeout 30s ./...
```

### Parallel Test Support

The reporter correctly handles parallel tests:

```go
func TestParallel(t *testing.T) {
    t.Parallel()
    
    tests := []struct{
        name string
        // ... test cases
    }{
        // ... test data
    }
    
    for _, tt := range tests {
        tt := tt // capture range variable
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()
            // ... test logic
        })
    }
}
```

### Benchmark Support

While the reporter focuses on tests, it gracefully handles benchmarks:

```bash
# Run benchmarks with the reporter
llm-go-test -bench=. ./...
```

## Configuration

Create a `.llm-reporter.json` file in your project root:

```json
{
  "mode": "summary",
  "outputFile": "",
  "truncateLength": 80,
  "stackTraceLines": 3
}
```

## Troubleshooting

### Common Issues

1. **Reporter not found**: Ensure the binary is in your PATH or use the full path
2. **No output**: Check that tests are actually failing - passing tests produce minimal output in summary mode
3. **Permission denied**: Make the binary executable with `chmod +x llm-go-test`

### Debug Mode

```bash
# See what command is being run
LLM_DEBUG=true llm-go-test ./...
```

## Best Practices

1. **Use table-driven tests**: They work well with the reporter's grouping
2. **Write descriptive test names**: These appear in the failure output
3. **Use subtests**: The reporter groups them nicely under parent tests
4. **Include context in errors**: Use `t.Errorf` with descriptive messages

## See Also

- [Go testing package documentation](https://pkg.go.dev/testing)
- [Testify assertion library](https://github.com/stretchr/testify)
- [Go test command documentation](https://pkg.go.dev/cmd/go#hdr-Test_packages)