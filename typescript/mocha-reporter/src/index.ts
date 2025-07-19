import * as Mocha from 'mocha';
import {
  OutputMode,
  ReporterConfig,
  TestResult,
  TestSuite,
  TestError,
  ConfigManager,
  SummaryFormatter,
  DetailedFormatter,
  ErrorClassifier,
  PatternDetector,
  OutputWriter,
  ReporterContext
} from '@llm-reporters/shared-utilities';

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_PENDING,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END
} = Mocha.Runner.constants;

class MochaLLMReporter extends Mocha.reporters.Base {
  private config: ConfigManager;
  private testResults: Map<string, TestResult[]> = new Map();
  private startTime: number = Date.now();
  private outputWriter: OutputWriter;

  constructor(runner: Mocha.Runner, options?: Mocha.MochaOptions) {
    super(runner, options);
    
    // Extract reporter options
    const reporterOptions = options?.reporterOptions || {};
    this.config = new ConfigManager(reporterOptions);
    const outputFile = this.config.get('outputFile');
    this.outputWriter = new OutputWriter(outputFile);

    // Register event handlers
    runner.on(EVENT_RUN_BEGIN, () => this.onRunBegin());
    runner.on(EVENT_SUITE_BEGIN, (suite: Mocha.Suite) => this.onSuiteBegin(suite));
    runner.on(EVENT_SUITE_END, (suite: Mocha.Suite) => this.onSuiteEnd(suite));
    runner.on(EVENT_TEST_PASS, (test: Mocha.Test) => this.onTestPass(test));
    runner.on(EVENT_TEST_FAIL, (test: Mocha.Test, err: any) => this.onTestFail(test, err));
    runner.on(EVENT_TEST_PENDING, (test: Mocha.Test) => this.onTestPending(test));
    runner.on(EVENT_RUN_END, () => this.onRunEnd());
  }

  private onRunBegin(): void {
    this.startTime = Date.now();
    this.testResults.clear();
  }

  private onSuiteBegin(suite: Mocha.Suite): void {
    // No longer needed
  }

  private onSuiteEnd(suite: Mocha.Suite): void {
    // No longer needed
  }

  private onTestPass(test: Mocha.Test): void {
    this.addTestResult(test, 'passed');
  }

  private onTestFail(test: Mocha.Test, err: any): void {
    this.addTestResult(test, 'failed', err);
  }

  private onTestPending(test: Mocha.Test): void {
    this.addTestResult(test, 'skipped');
  }

  private onRunEnd(): void {
    const testSuites = this.createTestSuites();
    const context = this.createContext(testSuites);
    const output = this.generateOutput(testSuites, context);
    this.outputWriter.write(output);
  }

  private addTestResult(test: Mocha.Test, status: 'passed' | 'failed' | 'skipped', err?: any): void {
    const filePath = test.file || 'unknown';
    const result = this.createTestResult(test, status, err);
    
    if (!this.testResults.has(filePath)) {
      this.testResults.set(filePath, []);
    }
    
    this.testResults.get(filePath)!.push(result);
  }

  private createTestSuites(): TestSuite[] {
    const suites: TestSuite[] = [];
    
    for (const [filePath, tests] of this.testResults.entries()) {
      const hasFailures = tests.some(t => t.status === 'failed');
      if (hasFailures || this.config.get('includePassedSuites')) {
        suites.push({
          name: filePath,
          filePath: filePath,
          tests: tests,
          duration: Date.now() - this.startTime
        });
      }
    }
    
    return suites;
  }

  private createTestResult(test: Mocha.Test, status: 'passed' | 'failed' | 'skipped', err?: any): TestResult {
    const hierarchy = this.getTestHierarchy(test);
    const suiteName = hierarchy.slice(0, -1).join(' > ') || 'Root';
    const testName = test.title;

    const result: TestResult = {
      suite: suiteName,
      testPath: test.file || 'unknown',
      testName: hierarchy.join(' > '),
      status,
      duration: test.duration || 0
    };

    if (status === 'failed' && err) {
      result.error = this.createTestError(err, test);
    }

    return result;
  }

  private createTestError(err: any, test: Mocha.Test): TestError {
    const errorType = ErrorClassifier.classify(err);
    
    // Extract line number from stack trace or use test location
    let line = 1;
    let column: number | undefined;
    
    if (err.stack) {
      // Try to find the test file in the stack trace
      const testFile = test.file;
      if (testFile) {
        const regex = new RegExp(`${testFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:(\\d+):(\\d+)`);
        const match = err.stack.match(regex);
        if (match) {
          line = parseInt(match[1], 10);
          column = parseInt(match[2], 10);
        }
      }
    }

    const testError: TestError = {
      type: errorType,
      message: err.message || String(err),
      file: test.file || 'unknown',
      line,
      column
    };

    // Add expected/received for assertion errors
    if (err.expected !== undefined || err.actual !== undefined) {
      testError.expected = this.truncateValue(String(err.expected));
      testError.received = this.truncateValue(String(err.actual));
    }

    // Add stack trace if configured
    const stackTraceLines = this.config.get('stackTraceLines');
    if (stackTraceLines > 0 && err.stack) {
      const lines = err.stack.split('\n').slice(0, stackTraceLines + 1);
      testError.stackTrace = lines.join('\n');
    }

    // Handle timeout errors
    if (err.message && err.message.includes('timeout')) {
      testError.timeout = test.timeout();
    }

    return testError;
  }

  private getTestHierarchy(test: Mocha.Test): string[] {
    const hierarchy: string[] = [];
    let current: Mocha.Suite | undefined = test.parent;

    while (current) {
      if (current.title) {
        hierarchy.unshift(current.title);
      }
      current = current.parent;
    }

    hierarchy.push(test.title);
    return hierarchy;
  }

  private truncateValue(value: string): string {
    const maxLength = this.config.get('maxValueLength');
    if (value.length <= maxLength) {
      return value;
    }
    return value.substring(0, maxLength) + '...';
  }

  private createContext(testSuites: TestSuite[]): ReporterContext {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let passedSuites = 0;
    let failedSuites = 0;

    for (const suite of testSuites) {
      const suiteFailures = suite.tests.filter(t => t.status === 'failed').length;
      if (suiteFailures > 0) {
        failedSuites++;
      } else {
        passedSuites++;
      }

      for (const test of suite.tests) {
        totalTests++;
        switch (test.status) {
          case 'passed':
            passedTests++;
            break;
          case 'failed':
            failedTests++;
            break;
          case 'skipped':
            skippedTests++;
            break;
        }
      }
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalSuites: testSuites.length,
      passedSuites,
      failedSuites,
      duration: Date.now() - this.startTime,
      startTime: this.startTime
    };
  }

  private generateOutput(testSuites: TestSuite[], context: ReporterContext): string {
    const failedTests = testSuites
      .flatMap(suite => suite.tests)
      .filter(test => test.status === 'failed');

    // Exit code is 1 if there are failures, 0 otherwise
    const exitCode = failedTests.length > 0 ? 1 : 0;

    if (this.config.get('mode') === OutputMode.SUMMARY) {
      return SummaryFormatter.format(testSuites, context, exitCode);
    } else {
      const detectPatterns = this.config.get('detectPatterns');
      return DetailedFormatter.format(testSuites, context, exitCode, detectPatterns);
    }
  }
}

// Export the reporter class
export = MochaLLMReporter;