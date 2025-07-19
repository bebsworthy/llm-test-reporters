#!/usr/bin/env node

/**
 * Test runner for validating reporter implementations
 * Executes standardized test scenarios across all reporters
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      timeout: options.timeout || 30000,
      outputDir: options.outputDir || path.join(__dirname, 'results')
    };

    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  /**
   * Run a specific test scenario with a reporter
   */
  async runScenario(reporterInfo, scenario) {
    const { framework, reporterPath, testCommand, configFile } = reporterInfo;
    const outputFile = path.join(
      this.options.outputDir,
      `${framework}_${scenario.name}.txt`
    );

    console.log(`Running ${framework} with scenario: ${scenario.name}`);

    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        LLM_REPORTER_MODE: scenario.mode || 'summary',
        LLM_REPORTER_OUTPUT_FILE: outputFile
      };

      // Prepare test command
      const [command, ...args] = testCommand.split(' ');
      
      const child = spawn(command, args, {
        cwd: reporterPath,
        env,
        shell: true
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Set timeout
      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        reject(new Error(`Test timed out after ${this.options.timeout}ms`));
      }, this.options.timeout);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (this.options.verbose) {
          process.stdout.write(data);
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (this.options.verbose) {
          process.stderr.write(data);
        }
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        
        if (timedOut) return;

        // Read output file if it exists
        let reporterOutput = '';
        if (fs.existsSync(outputFile)) {
          reporterOutput = fs.readFileSync(outputFile, 'utf8');
        } else {
          // Try to extract from stdout if no file was written
          reporterOutput = this.extractReporterOutput(stdout);
        }

        resolve({
          framework,
          scenario: scenario.name,
          exitCode: code,
          output: reporterOutput,
          stdout,
          stderr,
          outputFile
        });
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * Extract reporter output from stdout
   */
  extractReporterOutput(stdout) {
    // Look for LLM TEST REPORTER header
    const startMarker = '# LLM TEST REPORTER';
    const startIndex = stdout.indexOf(startMarker);
    
    if (startIndex === -1) {
      return stdout; // Return all if no marker found
    }

    // Find the end (usually EXIT CODE line)
    const exitCodeMatch = stdout.match(/EXIT CODE: \d+/);
    if (exitCodeMatch) {
      const endIndex = stdout.indexOf(exitCodeMatch[0]) + exitCodeMatch[0].length;
      return stdout.substring(startIndex, endIndex).trim();
    }

    return stdout.substring(startIndex).trim();
  }

  /**
   * Run all scenarios for a reporter
   */
  async runReporter(reporterInfo, scenarios) {
    const results = [];

    for (const scenario of scenarios) {
      try {
        const result = await this.runScenario(reporterInfo, scenario);
        results.push({
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          success: false,
          framework: reporterInfo.framework,
          scenario: scenario.name,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Generate a summary report
   */
  generateSummary(allResults) {
    const summary = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      frameworks: {}
    };

    for (const results of allResults) {
      for (const result of results) {
        summary.totalTests++;
        
        if (result.success) {
          summary.passed++;
        } else {
          summary.failed++;
        }

        const framework = result.framework;
        if (!summary.frameworks[framework]) {
          summary.frameworks[framework] = {
            total: 0,
            passed: 0,
            failed: 0,
            scenarios: []
          };
        }

        summary.frameworks[framework].total++;
        summary.frameworks[framework].scenarios.push({
          name: result.scenario,
          success: result.success,
          error: result.error
        });

        if (result.success) {
          summary.frameworks[framework].passed++;
        } else {
          summary.frameworks[framework].failed++;
        }
      }
    }

    return summary;
  }

  /**
   * Save results to JSON file
   */
  saveResults(results, filename) {
    const outputPath = path.join(this.options.outputDir, filename);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to: ${outputPath}`);
  }
}

// Define test scenarios
const TEST_SCENARIOS = [
  {
    name: 'summary-all-passing',
    mode: 'summary',
    description: 'All tests pass'
  },
  {
    name: 'summary-with-failures',
    mode: 'summary',
    description: 'Some tests fail'
  },
  {
    name: 'detailed-with-failures',
    mode: 'detailed',
    description: 'Detailed output with failures'
  },
  {
    name: 'timeout-errors',
    mode: 'detailed',
    description: 'Tests with timeout errors'
  },
  {
    name: 'pattern-detection',
    mode: 'detailed',
    description: 'Multiple similar failures for pattern detection'
  }
];

// Define reporter configurations
const REPORTERS = [
  {
    framework: 'jest',
    reporterPath: path.join(__dirname, '../typescript/jest-reporter'),
    testCommand: 'npm test',
    configFile: 'jest.config.js'
  },
  // Add more reporters as they are implemented
  // {
  //   framework: 'vitest',
  //   reporterPath: path.join(__dirname, '../typescript/vitest-reporter'),
  //   testCommand: 'npm test',
  //   configFile: 'vitest.config.js'
  // }
];

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    outputDir: args.find(arg => arg.startsWith('--output='))?.split('=')[1]
  };

  const runner = new TestRunner(options);

  console.log('='.repeat(60));
  console.log('LLM Test Reporter Validation Runner');
  console.log('='.repeat(60));
  console.log();

  (async () => {
    const allResults = [];

    for (const reporter of REPORTERS) {
      console.log(`\nTesting ${reporter.framework} reporter...`);
      console.log('-'.repeat(40));
      
      const results = await runner.runReporter(reporter, TEST_SCENARIOS);
      allResults.push(results);
    }

    // Generate and display summary
    const summary = runner.generateSummary(allResults);
    
    console.log('\n' + '='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log(`Total scenarios: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log();

    for (const [framework, stats] of Object.entries(summary.frameworks)) {
      console.log(`${framework}: ${stats.passed}/${stats.total} passed`);
      if (stats.failed > 0) {
        stats.scenarios
          .filter(s => !s.success)
          .forEach(s => console.log(`  ✗ ${s.name}: ${s.error}`));
      }
    }

    // Save detailed results
    runner.saveResults({
      summary,
      details: allResults,
      timestamp: new Date().toISOString()
    }, 'validation-results.json');

    process.exit(summary.failed > 0 ? 1 : 0);
  })().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;