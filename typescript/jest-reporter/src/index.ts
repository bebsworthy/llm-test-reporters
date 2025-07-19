/**
 * LLM-optimized Jest reporter
 */

import type { 
  Reporter, 
  Test, 
  TestResult as JestTestResult,
  AggregatedResult,
  TestContext,
  Config
} from '@jest/reporters';

import {
  ConfigManager,
  SummaryFormatter,
  DetailedFormatter,
  OutputWriter,
  TestSuite,
  TestResult,
  TestError,
  ReporterContext,
  OutputMode,
  ErrorClassifier,
  CodeContextExtractor
} from '@llm-reporters/shared-utilities';

export default class LLMJestReporter implements Reporter {
  private config: ConfigManager;
  private writer: OutputWriter;
  private suites: Map<string, TestSuite> = new Map();
  private context: ReporterContext;
  private startTime: number = Date.now();

  constructor(_globalConfig: Config.GlobalConfig, reporterConfig: any = {}) {
    this.config = new ConfigManager(reporterConfig);
    const outputFile = this.config.get('outputFile');
    this.writer = new OutputWriter(outputFile);
    
    this.context = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalSuites: 0,
      passedSuites: 0,
      failedSuites: 0,
      duration: 0,
      startTime: this.startTime
    };
  }

  onRunStart(): void {
    this.startTime = Date.now();
    this.suites.clear();
  }

  onTestFileStart(test: Test): void {
    // Initialize suite tracking
    const suite: TestSuite = {
      name: this.extractSuiteName(test.path),
      filePath: test.path,
      tests: [],
      duration: 0
    };
    this.suites.set(test.path, suite);
  }

  onTestFileResult(test: Test, testResult: JestTestResult): void {
    const suite = this.suites.get(test.path);
    if (!suite) return;

    // Update suite duration
    suite.duration = testResult.perfStats.runtime || 0;

    // Process test results
    for (const assertionResult of testResult.testResults) {
      // Build proper test hierarchy from ancestorTitles and title
      const hierarchy = [...(assertionResult.ancestorTitles || []), assertionResult.title];
      const fullTestName = hierarchy.join(' > ');
      
      const result: TestResult = {
        suite: suite.name,
        testPath: test.path,
        testName: fullTestName,
        status: assertionResult.status as 'passed' | 'failed' | 'skipped',
        duration: assertionResult.duration || 0
      };

      // Handle failures
      if (assertionResult.status === 'failed' && assertionResult.failureMessages.length > 0) {
        const errorInfo = this.parseFailureMessage(
          assertionResult.failureMessages[0],
          test.path,
          assertionResult.location || undefined
        );
        
        result.error = errorInfo;
      }

      suite.tests.push(result);
      this.updateContext(result);
    }

    // Update suite counts
    const hasFailed = suite.tests.some(t => t.status === 'failed');
    if (hasFailed) {
      this.context.failedSuites++;
    } else {
      this.context.passedSuites++;
    }
    this.context.totalSuites++;
  }

  onRunComplete(_testContexts: Set<TestContext>, results: AggregatedResult): void {
    this.context.duration = Date.now() - this.startTime;

    const suites = Array.from(this.suites.values());
    const exitCode = results.numFailedTests > 0 ? 1 : 0;
    
    // Format output based on mode
    const mode = this.config.get('mode');
    const output = mode === OutputMode.DETAILED
      ? DetailedFormatter.format(suites, this.context, exitCode, this.config.get('detectPatterns'))
      : SummaryFormatter.format(suites, this.context, exitCode);

    // Write output
    this.writer.write(output);
    this.writer.close();
  }

  getLastError(): Error | undefined {
    return undefined;
  }

  private extractSuiteName(filePath: string): string {
    // Extract meaningful suite name from file path
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.(test|spec)\.(js|ts|jsx|tsx)$/, '');
  }

  private parseFailureMessage(
    failureMessage: string,
    filePath: string,
    location?: { line: number; column: number }
  ): TestError {
    // Clean up Jest's failure message format
    const cleanedMessage = this.cleanJestMessage(failureMessage);
    
    // Create a pseudo-error for classification
    const error = new Error(cleanedMessage);
    error.stack = failureMessage;

    // Extract error details
    const errorDetails = ErrorClassifier.extractErrorDetails(error, filePath);
    
    // Try to extract line/column from stack trace if not provided
    let line = location?.line || 0;
    let column = location?.column;
    
    if (!line) {
      const locationInfo = CodeContextExtractor.findErrorLocation(error, filePath);
      if (locationInfo) {
        line = locationInfo.line;
        column = locationInfo.column;
      }
    }

    return {
      ...errorDetails,
      file: filePath,
      line,
      column
    };
  }

  private cleanJestMessage(message: string): string {
    // Remove Jest-specific formatting
    return message
      .replace(/\u001b\[[0-9;]*m/g, '') // Remove ANSI codes
      .replace(/^\s*●\s*/gm, '') // Remove bullet points
      .replace(/^\s*at\s+.*$/gm, '') // Remove stack trace lines
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();
  }

  private updateContext(result: TestResult): void {
    this.context.totalTests++;
    
    switch (result.status) {
      case 'passed':
        this.context.passedTests++;
        break;
      case 'failed':
        this.context.failedTests++;
        break;
      case 'skipped':
        this.context.skippedTests++;
        break;
    }
  }
}