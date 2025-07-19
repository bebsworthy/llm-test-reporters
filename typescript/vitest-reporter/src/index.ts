import type { Reporter, File, Task, Suite, TaskResult, TaskResultPack } from 'vitest';
import { 
  OutputMode, 
  ReporterConfig, 
  ErrorType,
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

class VitestLLMReporter implements Reporter {
  private config: ConfigManager;
  private testSuites: TestSuite[] = [];
  private startTime: number = Date.now();
  private outputWriter: OutputWriter;

  constructor(options: Partial<ReporterConfig> = {}) {
    this.config = new ConfigManager(options);
    const outputFile = this.config.get('outputFile');
    this.outputWriter = new OutputWriter(outputFile);
  }

  onInit() {
    this.testSuites = [];
    this.startTime = Date.now();
  }

  onFinished(files?: File[]) {
    if (!files) return;

    // Process all test files
    for (const file of files) {
      const suite = this.processFile(file);
      if (suite.tests.some(t => t.status === 'failed') || this.config.get('includePassedSuites')) {
        this.testSuites.push(suite);
      }
    }

    // Generate context
    const context = this.createContext();
    
    // Generate output
    const output = this.generateOutput(context);
    
    // Write output
    this.outputWriter.write(output);
  }

  private processFile(file: File): TestSuite {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Process all tasks recursively
    this.processTasksRecursively(file.tasks, file, tests);

    return {
      name: file.name,
      filePath: file.filepath,
      tests,
      duration: Date.now() - startTime
    };
  }

  private processTasksRecursively(tasks: Task[], file: File, results: TestResult[]) {
    for (const task of tasks) {
      if (task.type === 'test' && task.result) {
        const testResult = this.createTestResult(task, file);
        results.push(testResult);
      } else if (task.type === 'suite' && task.tasks) {
        this.processTasksRecursively(task.tasks, file, results);
      }
    }
  }

  private createTestResult(task: Task, file: File): TestResult {
    const hierarchy = this.getTestHierarchy(task);
    const suiteName = hierarchy.slice(0, -1).join(' > ') || file.name;
    const testName = hierarchy[hierarchy.length - 1] || task.name;
    
    let status: 'passed' | 'failed' | 'skipped';
    if (task.result?.state === 'pass') {
      status = 'passed';
    } else if (task.result?.state === 'fail') {
      status = 'failed';
    } else if (task.result?.state === 'skip') {
      status = 'skipped';
    } else {
      status = 'skipped'; // Default for unknown states
    }

    const result: TestResult = {
      suite: suiteName,
      testPath: file.filepath,
      testName,
      status,
      duration: task.result?.duration || 0
    };

    // Add error information if test failed
    if (status === 'failed' && task.result?.errors?.length) {
      result.error = this.createTestError(task.result.errors[0], file);
    }

    return result;
  }

  private createTestError(error: any, file: File): TestError {
    const errorType = ErrorClassifier.classify(error);
    
    // Extract line number from stack trace
    let line = 1;
    let column: number | undefined;
    if (error.stack) {
      const match = error.stack.match(new RegExp(`${file.filepath}:(\\d+):(\\d+)`));
      if (match) {
        line = parseInt(match[1], 10);
        column = parseInt(match[2], 10);
      }
    }

    const testError: TestError = {
      type: errorType,
      message: error.message || String(error),
      file: file.filepath,
      line,
      column
    };

    // Add expected/received for assertion errors
    if (error.expected !== undefined || error.actual !== undefined) {
      testError.expected = this.truncateValue(String(error.expected));
      testError.received = this.truncateValue(String(error.actual));
    }

    // Add stack trace if configured
    const stackTraceLines = this.config.get('stackTraceLines');
    if (stackTraceLines > 0 && error.stack) {
      const lines = error.stack.split('\n').slice(0, stackTraceLines + 1);
      testError.stackTrace = lines.join('\n');
    }

    return testError;
  }

  private getTestHierarchy(task: Task): string[] {
    const hierarchy: string[] = [];
    let current: Task | Suite | undefined = task;

    while (current) {
      if (current.name) {
        hierarchy.unshift(current.name);
      }
      current = current.suite;
    }

    return hierarchy;
  }

  private truncateValue(value: string): string {
    const maxLength = this.config.get('maxValueLength');
    if (value.length <= maxLength) {
      return value;
    }
    return value.substring(0, maxLength) + '...';
  }

  private createContext(): ReporterContext {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let passedSuites = 0;
    let failedSuites = 0;

    for (const suite of this.testSuites) {
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
      totalSuites: this.testSuites.length,
      passedSuites,
      failedSuites,
      duration: Date.now() - this.startTime,
      startTime: this.startTime
    };
  }

  private generateOutput(context: ReporterContext): string {
    const failedTests = this.testSuites
      .flatMap(suite => suite.tests)
      .filter(test => test.status === 'failed');

    // Exit code is 1 if there are failures, 0 otherwise
    const exitCode = failedTests.length > 0 ? 1 : 0;

    if (this.config.get('mode') === OutputMode.SUMMARY) {
      return SummaryFormatter.format(this.testSuites, context, exitCode);
    } else {
      const detectPatterns = this.config.get('detectPatterns');
      return DetailedFormatter.format(this.testSuites, context, exitCode, detectPatterns);
    }
  }
}

// Export default and configuration types for users
export default VitestLLMReporter;
export { ReporterConfig, OutputMode } from '@llm-reporters/shared-utilities';