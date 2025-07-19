# LLM-Optimized Test Reporters Project

* **Purpose:** A collection of test reporters/formatters for various testing libraries optimized for LLM context efficiency, reducing noise and highlighting failures to prevent LLMs from missing critical test errors.
* **Scope:** Initial focus on TypeScript/JavaScript testing frameworks with planned expansion to other popular programming languages. The project provides both minimal summary and detailed output modes.
* **Key Performance Indicators (KPIs):** 
  - 70%+ reduction in output tokens compared to default reporters
  - Zero missed test failures in LLM analysis
  - Sub-100ms reporter overhead per test suite
  - Support for 5+ TypeScript testing frameworks in v1.0

## Rules

- All reporters must output in the exact same format regardless of testing library
- Summary mode shows only failed tests by default
- Detailed mode provides actionable fix hints and minimal code context
- No ANSI color codes or terminal-specific formatting
- File paths must include line numbers in format: `file_path:line_number`
- Streaming output support required (no buffering entire test run)
- Configuration through environment variables or config files
- Must not interfere with native test framework functionality

## Structure

```
/reporters
-  /documentation
   -  project.specs.md          # This file
   -  tasks.md                  # Task tracking
   -  tasks.backlog.md          # Future tasks
   -  open-questions.md         # Open questions
   - reporter-format.feat.md   # Reporter format specification
-  /shared
   -  /format-examples          # Example outputs for all reporters
   -  /validation-suite         # Common test scenarios
-  /typescript
   -  /jest-reporter
      -  src/
      -  tests/
      -  package.json
      -  tsconfig.json
      - README.md
   -  /vitest-reporter
      -  src/
      -  tests/
      -  package.json
      -  tsconfig.json
      - README.md
   -  /mocha-reporter
      -  src/
      -  tests/
      -  package.json
      -  tsconfig.json
      - README.md
   -  /playwright-reporter
      -  src/
      -  tests/
      -  package.json
      -  tsconfig.json
      - README.md
   - /cypress-reporter
       -  src/
       -  tests/
       -  package.json
       -  tsconfig.json
       - README.md
-  /python
   -  /pytest-reporter
      -  src/
      -  tests/
      -  setup.py
      - README.md
   -  /unittest-reporter
      -  src/
      -  tests/
      -  setup.py
      - README.md
   - /behave-reporter
      -  src/
      -  tests/
      -  setup.py
      - README.md
-  /go
   -  /testing-reporter
      -  reporter.go
      -  reporter_test.go
      -  go.mod
      - README.md
   - /testify-reporter
      -  reporter.go
      -  reporter_test.go
      -  go.mod
      - README.md
-  /java
   -  /junit-reporter
      -  src/
      -  pom.xml
      - README.md
   - /testng-reporter
      -  src/
      -  pom.xml
      - README.md
-  /validation
   -  run-all.sh               # Runs all reporters with test suite
   -  compare-outputs.py       # Validates format compliance
   - expected/                # Expected output files
-  .gitignore
- README.md
```

## Core Components

### 1. Reporter Format Engine
- Unified formatter that all language-specific reporters use
- Handles summary vs detailed mode switching
- Pattern detection and error categorization
- Output streaming and truncation logic

### 2. Language Adapters
- Framework-specific implementations that hook into test runners
- Transform native test results to unified format
- Handle framework-specific configuration

### 3. Validation Suite
- Ensures all reporters produce identical output format
- Tests edge cases: timeouts, async failures, setup/teardown errors
- Performance benchmarking against native reporters

### 4. Configuration System
- Environment variables: `LLM_REPORTER_MODE`, `LLM_REPORTER_TRUNCATE`
- Config file support: `.llm-reporter.json`
- Framework-specific overrides

## Output Format Specification

### Summary Mode
- Header with reporter name and mode
- Failed test suites with test names only
- Final summary with counts and duration
- Exit code

### Detailed Mode  
- Header with reporter name and mode
- Per-failure details with:
  - Test hierarchy (suite > test name)
  - File path with line number
  - Error type classification
  - Expected vs received values
  - 3-line code context with error pointer
  - Failure reason and fix hint
- Pattern detection across failures
- Focus area suggestions
- Final summary

## Implementation Phases

### Phase 1: Foundation (TypeScript/JavaScript)
- Core formatter implementation
- Jest reporter (highest usage)
- Validation framework
- Basic documentation

### Phase 2: TypeScript Ecosystem
- Vitest reporter
- Mocha reporter
- Playwright reporter (E2E)
- Cypress reporter (E2E)

### Phase 3: Multi-Language Preparation
- Language adapter abstraction
- Cross-language validation tools
- CI/CD pipeline setup

### Phase 4: Python Ecosystem
- PyTest reporter
- unittest reporter
- Behave reporter (BDD)

### Phase 5: Java Ecosystem
- JUnit reporter
- TestNG reporter

### Phase 6+: Additional Languages
- Go, Rust, C#, Ruby, PHP, Swift, Kotlin

## Technical Decisions

### Independent Package Structure
- Each testing framework has its own independent directory
- Language-specific package managers (npm for JS/TS, pip for Python, go mod for Go, etc.)
- Shared format specification and validation suite
- Independent versioning and deployment per reporter

### TypeScript First
- All JavaScript/TypeScript reporters in TypeScript
- Type definitions for configuration and output format
- Strict type checking enabled

### Testing Strategy
- Each reporter tested with its own framework
- Snapshot testing for output validation
- Integration tests with real test suites
- Performance benchmarks

### Distribution
- NPM packages per reporter
- Single installation command per framework
- Zero configuration defaults
- Progressive enhancement with config

## Success Metrics

1. **Adoption**: 1000+ weekly downloads within 6 months
2. **Coverage**: Support for 80% of TypeScript test market share
3. **Performance**: <100ms overhead for 1000 test suites
4. **Accuracy**: Zero reported cases of missed failures
5. **Developer Experience**: <5 minute setup time