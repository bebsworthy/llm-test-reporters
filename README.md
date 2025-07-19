# LLM-Optimized Test Reporters

A collection of test reporters for various testing frameworks, optimized for LLM context efficiency. Reduces output noise by 70%+ while ensuring zero missed test failures.

## 🎯 Why LLM-Optimized Reporters?

Traditional test reporters output verbose, colorful text designed for human developers. When feeding test results to LLMs for analysis or debugging, this creates problems:

- **Token waste**: ANSI codes, decorative elements, and redundant information consume valuable context
- **Missed failures**: Important errors get buried in noise, causing LLMs to miss critical issues
- **Poor actionability**: Stack traces and error messages aren't formatted for LLM comprehension

Our reporters solve these problems with a clean, structured format that LLMs can efficiently parse and act upon.

## ✨ Features

- **70%+ output reduction** compared to default reporters
- **Zero missed failures** - all test failures prominently displayed
- **Two modes**: Summary (minimal) and Detailed (with code context)
- **Pattern detection** across multiple failures
- **Clean format** without ANSI codes or terminal formatting
- **Streaming support** for real-time output
- **<100ms overhead** for test suites with 1000+ tests

## 📦 Available Reporters

### TypeScript/JavaScript
- ✅ **Jest** - Full support with all features
- 🚧 Vitest - Coming soon
- 🚧 Mocha - Coming soon
- 🚧 Playwright - Coming soon
- 🚧 Cypress - Coming soon

### Other Languages (Planned)
- 📅 Python (pytest, unittest, behave)
- 📅 Go (testing, testify)
- 📅 Java (JUnit, TestNG)
- 📅 Ruby, PHP, C#, Rust

## 🚀 Quick Start

### Jest

```bash
npm install --save-dev @llm-reporters/jest-reporter
```

```javascript
// jest.config.js
module.exports = {
  reporters: [
    ['@llm-reporters/jest-reporter', {
      mode: 'summary' // or 'detailed'
    }]
  ]
};
```

Run your tests:
```bash
npm test
```

## 📋 Output Examples

### Summary Mode
Perfect for quick failure identification:

```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: /src/calculator.test.ts
FAILED TESTS:
- Calculator > addition > should handle negative numbers: Expected 0 but received -2
- Calculator > division > should throw on divide by zero: Expected function to throw

---
## SUMMARY
- PASSED SUITES: 8
- FAILED SUITES: 1
- TOTAL TESTS: 45 (43 passed, 2 failed)
- DURATION: 1.23s
- EXIT CODE: 1
```

### Detailed Mode
Includes code context and fix hints:

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
## ERROR PATTERNS DETECTED
- 2 tests failed due to incorrect arithmetic operations

## SUGGESTED FOCUS AREAS
1. Review arithmetic operations for edge cases
2. Add input validation for numeric operations

---
## SUMMARY
- TOTAL TESTS: 45 (43 passed, 2 failed)
- FAILURE RATE: 4.44%
- DURATION: 1.23s
- EXIT CODE: 1
```

## ⚙️ Configuration

### Environment Variables
```bash
LLM_REPORTER_MODE=detailed npm test
LLM_REPORTER_OUTPUT_FILE=results.txt npm test
```

### Configuration File
Create `.llm-reporter.json`:
```json
{
  "mode": "summary",
  "detectPatterns": true,
  "maxValueLength": 200,
  "outputFile": null
}
```

### Reporter Options
```javascript
{
  mode: 'summary' | 'detailed',    // Output verbosity
  detectPatterns: boolean,          // Pattern detection in detailed mode
  maxValueLength: number,           // Max length for expected/received values
  stackTraceLines: number,          // Number of stack trace lines (0 = none)
  outputFile: string | null         // Write to file instead of stdout
}
```

## 📚 Examples

See the [examples directory](examples/) for complete working examples:

- **[jest-example.md](examples/jest-example.md)** - Complete Jest reporter guide with code and configuration
- **[vitest-example.md](examples/vitest-example.md)** - Complete Vitest reporter guide with TypeScript examples
- More examples coming soon for Mocha, Playwright, and Cypress

## 🔧 Advanced Usage

### CI/CD Integration

```yaml
# GitHub Actions
- name: Run tests with LLM reporter
  run: npm test
  env:
    LLM_REPORTER_MODE: detailed
    LLM_REPORTER_OUTPUT_FILE: test-results.txt

- name: Analyze failures with AI
  if: failure()
  run: |
    cat test-results.txt | your-ai-tool analyze
```

### Programmatic Usage

```javascript
// Custom test script
const { execSync } = require('child_process');

try {
  execSync('npm test', {
    env: {
      ...process.env,
      LLM_REPORTER_MODE: 'detailed',
      LLM_REPORTER_OUTPUT_FILE: 'results.txt'
    }
  });
} catch (error) {
  const results = fs.readFileSync('results.txt', 'utf8');
  await analyzeWithLLM(results);
}
```

## 🏗️ Project Structure

```
reporters/
├── documentation/         # Project specs and tasks
├── shared/               # Shared examples and validation
├── typescript/           # TypeScript/JavaScript reporters
│   ├── jest-reporter/
│   ├── vitest-reporter/
│   └── ...
├── validation/           # Cross-reporter validation tools
└── README.md
```

## 🧪 Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/llm-test-reporters.git
cd llm-test-reporters

# Install dependencies
cd typescript/jest-reporter
npm install

# Build
npm run build

# Run tests
npm run test:example
```

### Running Validation

```bash
# Validate all reporters
./validation/run-all.sh

# Run performance benchmarks
./validation/benchmark.js
```

## 📊 Performance

Our reporters add minimal overhead:

| Reporter | Mode | Overhead | Output Reduction |
|----------|------|----------|------------------|
| Jest | Summary | <50ms | 75% |
| Jest | Detailed | <80ms | 60% |

Benchmarked on 1000-test suite, M1 MacBook Pro.

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Adding a New Reporter

1. Follow the structure in `typescript/jest-reporter/`
2. Implement the standard format from `documentation/reporter-format.feat.md`
3. Add tests demonstrating various failure types
4. Ensure validation passes: `./validation/run-all.sh`
5. Submit a PR with benchmark results

## 📄 License

MIT - See [LICENSE](LICENSE) for details.

## 🔗 Links

- [Format Specification](documentation/reporter-format.feat.md)
- [Issue Tracker](https://github.com/yourusername/llm-test-reporters/issues)
- [Changelog](CHANGELOG.md)

---

Made with ❤️ for developers using LLMs in their testing workflow.