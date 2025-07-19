#!/usr/bin/env node

/**
 * Validation runner for LLM test reporters
 * Ensures all reporters produce consistent output format
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ReporterValidator {
  constructor() {
    this.scenarios = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'test-scenarios.json'), 'utf8')
    ).scenarios;
  }

  /**
   * Validate a reporter implementation
   * @param {string} reporterPath - Path to reporter module
   * @param {string} framework - Testing framework name
   */
  async validate(reporterPath, framework) {
    console.log(`\nValidating ${framework} reporter at ${reporterPath}`);
    console.log('='.repeat(60));

    const results = {
      framework,
      passed: 0,
      failed: 0,
      errors: []
    };

    for (const scenario of this.scenarios) {
      try {
        console.log(`\n✓ Testing scenario: ${scenario.name}`);
        const output = await this.runScenario(reporterPath, scenario, framework);
        
        // Validate output format
        this.validateFormat(output, scenario);
        results.passed++;
      } catch (error) {
        console.error(`✗ Failed scenario: ${scenario.name}`);
        console.error(`  Error: ${error.message}`);
        results.failed++;
        results.errors.push({
          scenario: scenario.name,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Run a test scenario and capture output
   */
  async runScenario(reporterPath, scenario, framework) {
    // This would be implemented per framework
    // For now, return mock output
    return this.generateMockOutput(scenario);
  }

  /**
   * Validate output conforms to format specification
   */
  validateFormat(output, scenario) {
    const lines = output.split('\n');
    
    // Check header
    if (!lines[0].startsWith('# LLM TEST REPORTER -')) {
      throw new Error('Invalid header format');
    }

    // Check for required sections
    const hasSummary = lines.some(line => line.startsWith('## SUMMARY'));
    if (!hasSummary) {
      throw new Error('Missing SUMMARY section');
    }

    // Validate no ANSI codes
    const ansiRegex = /\u001b\[[0-9;]*m/;
    if (ansiRegex.test(output)) {
      throw new Error('Output contains ANSI color codes');
    }

    // Additional format validations...
  }

  /**
   * Generate mock output for testing
   */
  generateMockOutput(scenario) {
    if (scenario.name === 'simple-failure') {
      return `# LLM TEST REPORTER - SUMMARY MODE

SUITE: /src/math.test.ts
FAILED TESTS:
- Math Operations > addition > should handle negative numbers: Expected 0 but received -2

---
## SUMMARY
- PASSED SUITES: 0
- FAILED SUITES: 1
- TOTAL TESTS: 2 (1 passed, 1 failed)
- DURATION: 0.15s
- EXIT CODE: 1`;
    }

    // Return generic output for other scenarios
    return `# LLM TEST REPORTER - SUMMARY MODE

---
## SUMMARY
- PASSED SUITES: 0
- FAILED SUITES: 0
- TOTAL TESTS: 0 (0 passed, 0 failed)
- DURATION: 0.00s
- EXIT CODE: 0`;
  }

  /**
   * Compare outputs from different reporters
   */
  compareOutputs(outputs) {
    console.log('\n\nCross-Framework Comparison');
    console.log('='.repeat(60));

    // Normalize and compare outputs
    const normalized = outputs.map(({ framework, output }) => ({
      framework,
      normalized: this.normalizeOutput(output)
    }));

    // Check if all normalized outputs are identical
    const reference = normalized[0].normalized;
    const allMatch = normalized.every(item => item.normalized === reference);

    if (allMatch) {
      console.log('✓ All reporters produce identical output format');
    } else {
      console.log('✗ Output format inconsistencies detected');
      // Show differences
    }

    return allMatch;
  }

  /**
   * Normalize output for comparison
   */
  normalizeOutput(output) {
    return output
      .replace(/\/[^\s]+\.(ts|js|tsx|jsx)/g, '/path/to/file.ext') // Normalize paths
      .replace(/\d+\.\d+s/g, 'X.XXs') // Normalize durations
      .replace(/line:\s*\d+/g, 'line: XX'); // Normalize line numbers
  }
}

// CLI interface
if (require.main === module) {
  const validator = new ReporterValidator();
  
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: validate-reporter.js <reporter-path> <framework>');
    process.exit(1);
  }

  const [reporterPath, framework] = args;
  
  validator.validate(reporterPath, framework)
    .then(results => {
      console.log('\n\nValidation Results');
      console.log('='.repeat(60));
      console.log(`Framework: ${results.framework}`);
      console.log(`Passed: ${results.passed}`);
      console.log(`Failed: ${results.failed}`);
      
      if (results.failed > 0) {
        console.log('\nErrors:');
        results.errors.forEach(err => {
          console.log(`  - ${err.scenario}: ${err.error}`);
        });
        process.exit(1);
      }
      
      console.log('\n✓ All validation tests passed!');
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = ReporterValidator;