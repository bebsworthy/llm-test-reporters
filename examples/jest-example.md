# Jest LLM Reporter Example

This example demonstrates how to use the LLM-optimized Jest reporter.

## Setup

### 1. Install Dependencies

```bash
npm install --save-dev jest @llm-reporters/jest-reporter
```

### 2. Configure Jest

Create `jest.config.js`:

```javascript
module.exports = {
  reporters: [
    ['@llm-reporters/jest-reporter', {
      mode: 'summary', // or 'detailed'
      detectPatterns: true,
      maxValueLength: 200
    }]
  ]
};
```

### 3. Configuration Options

Create `.llm-reporter.json` (optional):

```json
{
  "mode": "summary",
  "detectPatterns": true,
  "maxValueLength": 200,
  "stackTraceLines": 0,
  "outputFile": null,
  "includePassedSuites": false
}
```

## Environment Variables

```bash
# Set output mode
LLM_REPORTER_MODE=detailed npm test

# Save to file
LLM_REPORTER_OUTPUT_FILE=results.txt npm test

# Configure inline
LLM_REPORTER_MODE=detailed LLM_REPORTER_MAX_VALUE_LENGTH=100 npm test
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
        env:
          LLM_REPORTER_MODE: summary
          LLM_REPORTER_OUTPUT_FILE: test-results.txt
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results.txt
```

## Advanced Configuration

### For Development
```javascript
// jest.config.js
module.exports = {
  reporters: [
    ['@llm-reporters/jest-reporter', {
      mode: 'detailed',
      detectPatterns: true,
      stackTraceLines: 3,
      maxValueLength: 300
    }]
  ]
};
```

### For CI/CD
```javascript
// jest.config.js
module.exports = {
  reporters: [
    ['@llm-reporters/jest-reporter', {
      mode: 'summary',
      outputFile: process.env.CI ? './test-results.txt' : null,
      maxValueLength: 100,
      stackTraceLines: 0
    }]
  ]
};
```

### For LLM Analysis
```javascript
// jest.config.js
module.exports = {
  reporters: [
    ['@llm-reporters/jest-reporter', {
      mode: 'detailed',
      detectPatterns: true,
      stackTraceLines: 0,  // LLMs don't need stack traces
      maxValueLength: 150,
      outputFile: './llm-analysis.txt'
    }]
  ]
};
```

## Tips

1. **Use Summary Mode** for quick CI/CD checks and initial failure scans
2. **Use Detailed Mode** when debugging specific failures or for LLM analysis
3. **Disable Stack Traces** when outputting for LLMs (they add noise without value)
4. **Enable Pattern Detection** to identify systemic issues across multiple tests
5. **Output to File** when integrating with other tools or for artifact storage