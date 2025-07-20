<div align="center">

![image](https://img.shields.io/badge/100%25_AI-certified_slop-FBB040?style=for-the-badge&logo=claude&logoColor=white)

</div>

# LLM-Optimized Test Reporters

A collection of test reporters for various testing frameworks, optimized for LLM context efficiency. These reporters aim to reduce output noise and help minimize missed test failures when analyzed by LLMs.

## 🎯 Why LLM-Optimized Reporters?

Traditional test reporters output verbose, colorful text designed for human developers. When feeding test results to LLMs for analysis or debugging, this creates problems:

- **Token waste**: ANSI codes, decorative elements, and redundant information consume valuable context
- **Missed failures**: Important errors get buried in noise, causing LLMs to miss critical issues
- **Poor actionability**: Stack traces and error messages aren't formatted for LLM comprehension

These reporters attempt to address these issues with a cleaner, more structured format that may be easier for LLMs to parse and analyze.

## ✨ Features

- **Reduced output** compared to default reporters by focusing on failures
- **Improved failure visibility** - test failures are prominently displayed
- **Two modes**: Summary (minimal) and Detailed (with code context)
- **Clean format** without ANSI codes or terminal formatting


## 📦 Available Reporters

### TypeScript/JavaScript
- ✅ **Jest** - Full support with all features
- ✅ **Vitest** - Full support with TypeScript
- ✅ **Mocha** - Full support with async patterns
- ✅ **Playwright** - Full support for E2E testing
- ✅ **Cypress** - Full support with multi-spec aggregation

### Python
- ✅ **pytest** - Full support with plugin system
- ✅ **unittest** - Full support with TestResult implementation

### Go
- ✅ **go test** - Full support (works with standard testing package and testify)

### Other Languages (Planned)
- 📅 Java (JUnit, TestNG)
- 📅 Ruby, PHP, C#, Rust

## 🚀 Quick Start

Choose your testing framework and install the corresponding reporter:

### TypeScript/JavaScript
```bash
# For Jest
npm install --save-dev @llm-reporters/jest-reporter

# For Vitest
npm install --save-dev @llm-reporters/vitest-reporter

# For Mocha
npm install --save-dev @llm-reporters/mocha-reporter

# For Playwright
npm install --save-dev @llm-reporters/playwright-reporter

# For Cypress
npm install --save-dev @llm-test-reporter/cypress
```

### Python
```bash
# For pytest
pip install llm-pytest-reporter

# For unittest
pip install llm-unittest-reporter
```

### Go
```bash
# Build from source
git clone https://github.com/llm-reporters/go-testing-reporter.git
cd go-testing-reporter
go build -o llm-go-test .

# Or install globally
go install github.com/llm-reporters/go-testing-reporter@latest
```

Then configure your test framework to use the reporter. See the detailed guides for each framework:

- **[Jest Configuration Guide](examples/jest-example.md)**
- **[Vitest Configuration Guide](examples/vitest-example.md)**
- **[Mocha Configuration Guide](examples/mocha-example.md)**
- **[Playwright Configuration Guide](examples/playwright-example.md)**
- **[Cypress Configuration Guide](examples/cypress-example.md)**
- **[pytest Configuration Guide](examples/pytest-example.md)**
- **[unittest Configuration Guide](examples/unittest-example.md)**
- **[Go Configuration Guide](examples/go-example.md)**

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
  "maxValueLength": 200,
  "outputFile": null
}
```

### Reporter Options
```javascript
{
  mode: 'summary' | 'detailed',    // Output verbosity
  maxValueLength: number,           // Max length for expected/received values
  stackTraceLines: number,          // Number of stack trace lines (0 = none)
  outputFile: string | null         // Write to file instead of stdout
}
```

## 📚 Examples

See the [examples directory](examples/) for complete working examples:

### TypeScript/JavaScript
- **[jest-example.md](examples/jest-example.md)** - Complete Jest reporter guide with code and configuration
- **[vitest-example.md](examples/vitest-example.md)** - Complete Vitest reporter guide with TypeScript examples
- **[mocha-example.md](examples/mocha-example.md)** - Mocha reporter guide with async patterns
- **[playwright-example.md](examples/playwright-example.md)** - Playwright E2E testing guide
- **[cypress-example.md](examples/cypress-example.md)** - Cypress testing guide with aggregation

### Python
- **[pytest-example.md](examples/pytest-example.md)** - pytest reporter guide with fixtures and parametrized tests
- **[unittest-example.md](examples/unittest-example.md)** - unittest reporter guide with TestCase examples

### Go
- **[go-example.md](examples/go-example.md)** - Go test reporter guide with table-driven tests and testify support

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
├── python/               # Python reporters
│   ├── pytest-reporter/
│   └── unittest-reporter/
├── go/                   # Go reporters
│   ├── testing-reporter/
│   └── shared/
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

The reporters are designed to add minimal overhead:

| Reporter | Mode | Overhead | Output Reduction |
|----------|------|----------|------------------|
| Jest | Summary | <50ms | ~70%+ |
| Jest | Detailed | <80ms | ~60%+ |

*Estimates based on initial testing with 1000-test suite.*

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