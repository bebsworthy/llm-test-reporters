import type { 
  Reporter, 
  FullConfig, 
  Suite, 
  TestCase, 
  TestResult as PlaywrightTestResult, 
  FullResult,
  TestStep
} from '@playwright/test/reporter';
import * as path from 'path';

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
  OutputWriter,
  ReporterContext
} from '@llm-reporters/shared-utilities';

interface TestInfo {
  test: TestCase;
  result: PlaywrightTestResult;
}

class PlaywrightLLMReporter implements Reporter {
  private config: ConfigManager;
  private outputWriter: OutputWriter;
  private testsByFile: Map<string, TestInfo[]> = new Map();
  private startTime: number = Date.now();
  private totalTests: number = 0;

  constructor(options: Partial<ReporterConfig> = {}) {
    this.config = new ConfigManager(options);
    const outputFile = this.config.get('outputFile');
    this.outputWriter = new OutputWriter(outputFile);
  }

  printsToStdio(): boolean {
    // We handle our own output
    return true;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.startTime = Date.now();
    this.testsByFile.clear();
    // Don't rely on suite.allTests() as it might not be populated yet
    this.totalTests = 0;
  }

  onTestBegin(test: TestCase): void {
    // Ensure we track the test even if onTestEnd isn't called
    const filePath = test.location.file;
    if (!this.testsByFile.has(filePath)) {
      this.testsByFile.set(filePath, []);
    }
  }

  onTestEnd(test: TestCase, result: PlaywrightTestResult): void {
    const filePath = test.location.file;
    
    if (!this.testsByFile.has(filePath)) {
      this.testsByFile.set(filePath, []);
    }
    
    this.testsByFile.get(filePath)!.push({ test, result });
    this.totalTests++;
  }

  onEnd(result: FullResult): void {
    // If no tests were captured, create minimal output
    if (this.totalTests === 0) {
      // Playwright might not be calling onTestEnd
      const output = `# LLM TEST REPORTER - SUMMARY MODE

---
## SUMMARY
- PASSED SUITES: 0
- FAILED SUITES: 0
- TOTAL TESTS: 0 (0 passed, 0 failed)
- DURATION: ${Date.now() - this.startTime}ms
- EXIT CODE: ${result.status === 'passed' ? 0 : 1}`;
      this.outputWriter.write(output);
      return;
    }
    
    const testSuites = this.createTestSuites();
    const context = this.createContext(testSuites);
    const output = this.generateOutput(testSuites, context);
    this.outputWriter.write(output);
  }

  private createTestSuites(): TestSuite[] {
    const suites: TestSuite[] = [];
    
    for (const [filePath, testInfos] of this.testsByFile.entries()) {
      const tests: TestResult[] = testInfos.map(({ test, result }) => 
        this.createTestResult(test, result)
      );
      
      const hasFailures = tests.some(t => t.status === 'failed');
      
      if (hasFailures || this.config.get('includePassedSuites')) {
        suites.push({
          name: filePath,
          filePath: filePath,
          tests: tests,
          duration: tests.reduce((sum, t) => sum + t.duration, 0)
        });
      }
    }
    
    return suites;
  }

  private createTestResult(test: TestCase, result: PlaywrightTestResult): TestResult {
    const hierarchy = this.getTestHierarchy(test);
    const fullTestName = hierarchy.join(' > ');
    
    // Map Playwright status to our status
    let status: 'passed' | 'failed' | 'skipped';
    switch (result.status) {
      case 'passed':
        status = 'passed';
        break;
      case 'failed':
      case 'timedOut':
      case 'interrupted':
        status = 'failed';
        break;
      case 'skipped':
        status = 'skipped';
        break;
      default:
        status = 'skipped';
    }
    
    const testResult: TestResult = {
      suite: hierarchy.slice(0, -1).join(' > ') || 'Root',
      testPath: test.location.file,
      testName: fullTestName,
      status,
      duration: result.duration
    };
    
    if (status === 'failed' && result.error) {
      testResult.error = this.createTestError(test, result);
    }
    
    return testResult;
  }

  private getTestHierarchy(test: TestCase): string[] {
    const hierarchy: string[] = [];
    let current: Suite | undefined = test.parent;
    
    // Walk up the parent chain to build hierarchy
    while (current && current.title) {
      hierarchy.unshift(current.title);
      current = current.parent;
    }
    
    // Add test title and project name if available
    const project = test.parent?.project();
    if (project?.name) {
      hierarchy.push(test.title + ' > ' + project.name);
    } else {
      hierarchy.push(test.title);
    }
    
    return hierarchy;
  }

  private createTestError(test: TestCase, result: PlaywrightTestResult): TestError {
    const error = result.error!;
    const errorType = ErrorClassifier.classify(error as Error);
    
    // Extract line number from error or test location
    let line = test.location.line || 1;
    let column = test.location.column;
    
    // Try to get more specific location from error stack
    if (error.stack) {
      const match = error.stack.match(new RegExp(`${test.location.file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:(\\d+):(\\d+)`));
      if (match) {
        line = parseInt(match[1], 10);
        column = parseInt(match[2], 10);
      }
    }
    
    const testError: TestError = {
      type: errorType,
      message: this.formatErrorMessage(error, result),
      file: test.location.file,
      line,
      column
    };
    
    // Add expected/received for assertion errors
    if (error.message?.includes('expect(')) {
      const expectedMatch = error.message.match(/Expected: (.+?)(?:\n|$)/);
      const receivedMatch = error.message.match(/Received: (.+?)(?:\n|$)/);
      
      if (expectedMatch) {
        testError.expected = this.truncateValue(expectedMatch[1]);
      }
      if (receivedMatch) {
        testError.received = this.truncateValue(receivedMatch[1]);
      }
    }
    
    // Add stack trace if configured
    const stackTraceLines = this.config.get('stackTraceLines');
    if (stackTraceLines > 0 && error.stack) {
      const lines = error.stack.split('\n').slice(0, stackTraceLines + 1);
      testError.stackTrace = lines.join('\n');
    }
    
    // Handle timeout errors
    if (result.status === 'timedOut') {
      testError.timeout = test.timeout;
    }
    
    // Add browser context if available
    const projectName = test.parent?.project()?.name;
    if (projectName) {
      testError.browserName = projectName;
    }
    
    // Add screenshot/trace info if available
    const screenshots = result.attachments.filter(a => a.name === 'screenshot');
    const traces = result.attachments.filter(a => a.name === 'trace');
    const videos = result.attachments.filter(a => a.name === 'video');
    
    if (screenshots.length > 0) {
      testError.screenshotPath = screenshots[0].path;
    }
    if (traces.length > 0) {
      testError.tracePath = traces[0].path;
    }
    if (videos.length > 0) {
      testError.videoPath = videos[0].path;
    }
    
    return testError;
  }

  private formatErrorMessage(error: any, result: PlaywrightTestResult): string {
    let message = error.message || String(error);
    
    // Clean up Playwright-specific error prefixes
    message = message.replace(/^Error: /, '');
    message = message.replace(/^TimeoutError: /, '');
    
    // For timeout errors, make the message more concise
    if (result.status === 'timedOut') {
      const timeoutMatch = message.match(/Timeout (\d+)ms exceeded/);
      if (timeoutMatch) {
        const action = message.split(':')[1]?.trim().split(' ')[0] || 'operation';
        return `Timeout ${timeoutMatch[1]}ms exceeded for ${action}`;
      }
    }
    
    // Extract the first line for summary mode
    const firstLine = message.split('\n')[0];
    return firstLine;
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
      totalTests: this.totalTests,
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

export = PlaywrightLLMReporter;