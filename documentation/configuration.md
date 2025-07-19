# Configuration Guide

This guide covers all configuration options for LLM-optimized test reporters.

## Configuration Methods

Configuration can be provided through three methods, in order of precedence (highest to lowest):

1. **Environment Variables** - Override all other settings
2. **Configuration File** - Project-wide settings
3. **Reporter Options** - Default settings in test config

## Environment Variables

Environment variables provide the highest precedence and are ideal for CI/CD environments.

### Core Variables

```bash
# Output mode: 'summary' or 'detailed'
LLM_REPORTER_MODE=detailed

# Maximum length for expected/received values (detailed mode)
LLM_REPORTER_MAX_VALUE_LENGTH=500

# Number of stack trace lines to include (0 = none)
LLM_REPORTER_STACK_TRACE_LINES=3

# Enable/disable pattern detection (detailed mode)
LLM_REPORTER_DETECT_PATTERNS=false

# Output to file instead of stdout
LLM_REPORTER_OUTPUT_FILE=/path/to/results.txt
```

### Example Usage

```bash
# Run with detailed output to file
LLM_REPORTER_MODE=detailed \
LLM_REPORTER_OUTPUT_FILE=test-results.txt \
npm test

# CI/CD pipeline example
export LLM_REPORTER_MODE=summary
export LLM_REPORTER_OUTPUT_FILE=$GITHUB_WORKSPACE/test-output.txt
npm test
```

## Configuration File

Create `.llm-reporter.json` in your project root for persistent configuration.

### Basic Configuration

```json
{
  "mode": "summary",
  "detectPatterns": true,
  "maxValueLength": 200,
  "outputFile": null,
  "includePassedSuites": false
}
```

### Advanced Configuration

```json
{
  "mode": "detailed",
  "detectPatterns": true,
  "maxValueLength": 300,
  "stackTraceLines": 2,
  "outputFile": "./test-results/output.txt",
  "includePassedSuites": false,
  "frameworkOptions": {
    "jest": {
      "includeSnapshotDetails": true,
      "groupByDescribe": true,
      "showTestPath": true
    },
    "playwright": {
      "includeTraceLinks": true,
      "includeBrowserInfo": true
    },
    "cypress": {
      "includeCommandLog": false,
      "maxCommandLogLength": 100
    }
  }
}
```

## Reporter Options

Configure directly in your test framework configuration file.

### Jest

```javascript
// jest.config.js
module.exports = {
  reporters: [
    ['@llm-reporters/jest-reporter', {
      mode: 'detailed',
      detectPatterns: true,
      maxValueLength: 250,
      outputFile: process.env.CI ? './ci-test-output.txt' : null
    }]
  ]
};
```

### Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: [
      ['@llm-reporters/vitest-reporter', {
        mode: 'summary',
        outputFile: './test-output.txt'
      }]
    ]
  }
});
```

### Playwright

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['@llm-reporters/playwright-reporter', {
      mode: 'detailed',
      includeTraceLinks: true,
      outputFile: process.env.TEST_RESULTS_FILE
    }]
  ]
});
```

## Configuration Options Reference

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'summary' \| 'detailed'` | `'summary'` | Output verbosity level |
| `detectPatterns` | `boolean` | `true` | Detect patterns across failures (detailed mode) |
| `maxValueLength` | `number` | `200` | Maximum length for expected/received values |
| `stackTraceLines` | `number` | `0` | Number of stack trace lines to include |
| `outputFile` | `string \| null` | `null` | File path for output (null = stdout) |
| `includePassedSuites` | `boolean` | `false` | Include passed test suites in output |

### Framework-Specific Options

#### Jest Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeSnapshotDetails` | `boolean` | `false` | Include snapshot diff details |
| `groupByDescribe` | `boolean` | `true` | Group tests by describe blocks |
| `showTestPath` | `boolean` | `true` | Show file paths in output |

#### Playwright Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeTraceLinks` | `boolean` | `false` | Include trace file links |
| `includeBrowserInfo` | `boolean` | `false` | Include browser version info |
| `includeScreenshots` | `boolean` | `false` | Include screenshot paths |

#### Cypress Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeCommandLog` | `boolean` | `false` | Include Cypress command log |
| `maxCommandLogLength` | `number` | `100` | Max commands to show |
| `includeVideoPath` | `boolean` | `false` | Include video recording path |

## Mode Comparison

### Summary Mode

Best for:
- Quick failure identification
- CI/CD pipelines
- Large test suites
- Initial error scanning

Output includes:
- Failed test names only
- Basic error messages
- Suite-level summaries
- Overall statistics

### Detailed Mode

Best for:
- Debugging specific failures
- Understanding error patterns
- Getting fix suggestions
- Code-level analysis

Output includes:
- Full error details
- Code context with line numbers
- Expected vs received values
- Error type classification
- Pattern detection
- Fix hints

## Best Practices

### For Development

```json
{
  "mode": "detailed",
  "detectPatterns": true,
  "outputFile": null
}
```

- Use detailed mode for rich debugging information
- Enable pattern detection to spot systemic issues
- Output to console for immediate feedback

### For CI/CD

```json
{
  "mode": "summary",
  "outputFile": "./test-results/output.txt",
  "maxValueLength": 100
}
```

- Use summary mode to minimize log size
- Write to file for artifact storage
- Reduce value lengths to save space

### For LLM Analysis

```json
{
  "mode": "detailed",
  "detectPatterns": true,
  "stackTraceLines": 0,
  "maxValueLength": 150
}
```

- Use detailed mode for context
- Disable stack traces (LLMs don't need them)
- Moderate value lengths for efficiency
- Enable pattern detection for insights

## Troubleshooting

### Output Not Appearing

1. Check environment variables aren't overriding config
2. Ensure reporter is properly installed
3. Verify output file path is writable

### Configuration Not Loading

1. Check `.llm-reporter.json` is in project root
2. Validate JSON syntax
3. Ensure no typos in option names

### Environment Variables Not Working

```bash
# Debug: Print current settings
echo $LLM_REPORTER_MODE
echo $LLM_REPORTER_OUTPUT_FILE

# Ensure variables are exported
export LLM_REPORTER_MODE=detailed
```

## Migration Guide

### From Default Reporters

```javascript
// Before (Jest)
module.exports = {
  reporters: ['default']
};

// After
module.exports = {
  reporters: [
    ['@llm-reporters/jest-reporter', {
      mode: 'summary'
    }]
  ]
};
```

### From v0.x to v1.x

Breaking changes:
- `outputMode` renamed to `mode`
- `truncateValues` replaced by `maxValueLength`
- `showPatterns` renamed to `detectPatterns`

```json
// Old config (v0.x)
{
  "outputMode": "minimal",
  "truncateValues": true,
  "showPatterns": true
}

// New config (v1.x)
{
  "mode": "summary",
  "maxValueLength": 200,
  "detectPatterns": true
}
```