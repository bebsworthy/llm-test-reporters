/**
 * Detailed mode formatter implementation
 */

import { TestSuite, TestResult, ReporterContext, ErrorPattern } from './types';
import { Formatter } from './formatter';
import { PatternDetector } from './pattern-detector';
import { CodeContextExtractor } from './code-context';
import { ErrorClassifier } from './error-classifier';

export class DetailedFormatter {
  static format(
    suites: TestSuite[], 
    context: ReporterContext,
    exitCode: number,
    detectPatterns: boolean = true
  ): string {
    const lines: string[] = [];
    
    // Add leading newline to separate from Jest output
    lines.push('');
    
    // Header
    lines.push(Formatter.HEADER_DETAILED);
    lines.push('');

    // Collect all failed tests
    const allFailedTests: TestResult[] = [];
    for (const suite of suites) {
      const failedTests = suite.tests.filter(test => test.status === 'failed');
      allFailedTests.push(...failedTests);
    }

    // Format each failure
    let failureNumber = 1;
    for (const test of allFailedTests) {
      if (!test.error) continue;

      lines.push(`## TEST FAILURE #${failureNumber}`);
      lines.push(`SUITE: ${test.suite}`);
      lines.push(`TEST: ${test.testName}`);
      lines.push(`FILE: ${Formatter.formatFilePath(test.error.file, test.error.line)}`);
      lines.push(`TYPE: ${test.error.type}`);
      lines.push('');

      // Expected/Received for assertion errors
      if (test.error.expected !== undefined || test.error.received !== undefined) {
        if (test.error.expected !== undefined) {
          lines.push(`EXPECTED: ${Formatter.truncate(test.error.expected, 200)}`);
        }
        if (test.error.received !== undefined) {
          lines.push(`RECEIVED: ${Formatter.truncate(test.error.received, 200)}`);
        }
        lines.push('');
      }

      // Code context
      const codeContext = CodeContextExtractor.extractContext(
        test.error.file,
        test.error.line,
        test.error.column
      );

      if (codeContext) {
        lines.push('CODE CONTEXT:');
        const formattedContext = CodeContextExtractor.formatContext(codeContext);
        lines.push(...formattedContext);
        lines.push('');
      }

      // Failure reason and fix hint
      lines.push(`FAILURE REASON: ${this.generateFailureReason(test)}`);
      lines.push(`FIX HINT: ${this.generateFixHint(test)}`);
      lines.push('');

      failureNumber++;
    }

    // Pattern detection
    if (detectPatterns && allFailedTests.length >= 2) {
      const patterns = PatternDetector.detectPatterns(allFailedTests);
      
      if (patterns.length > 0) {
        lines.push(Formatter.SEPARATOR);
        lines.push('## ERROR PATTERNS DETECTED');
        
        for (const pattern of patterns) {
          lines.push(`- ${pattern.count} tests failed due to ${pattern.description}`);
        }
        lines.push('');

        // Suggested focus areas
        const suggestions = PatternDetector.getSuggestedFocusAreas(patterns);
        if (suggestions.length > 0) {
          lines.push('## SUGGESTED FOCUS AREAS');
          suggestions.forEach((suggestion, index) => {
            lines.push(`${index + 1}. ${suggestion}`);
          });
          lines.push('');
        }
      }
    }

    // Summary section
    lines.push(Formatter.SEPARATOR);
    lines.push(Formatter.formatDetailedSummarySection(context, exitCode));

    return Formatter.ensureNoAnsiCodes(lines.join('\n'));
  }

  private static generateFailureReason(test: TestResult): string {
    if (!test.error) return 'Unknown failure';

    const { type, message, expected, received } = test.error;

    switch (type) {
      case 'Assertion Error':
        if (expected !== undefined && received !== undefined) {
          return `Expected value ${expected} but received ${received}`;
        }
        return message;
      
      case 'Type Error':
        return `Type error: ${message}`;
      
      case 'Reference Error':
        const match = message.match(/(\w+) is not defined/);
        if (match) {
          return `Variable '${match[1]}' is used without being declared`;
        }
        return message;
      
      case 'Timeout':
        return `Test execution exceeded configured timeout`;
      
      case 'Test Setup Error':
        return `Error occurred during test setup phase`;
      
      case 'Test Teardown Error':
        return `Error occurred during test cleanup phase`;
      
      default:
        return message;
    }
  }

  private static generateFixHint(test: TestResult): string {
    if (!test.error) return 'Review test implementation';

    const { type, message } = test.error;

    switch (type) {
      case 'Assertion Error':
        if (message.includes('toBe')) {
          return 'Check the expected value or fix the implementation to return correct result';
        }
        if (message.includes('toThrow')) {
          return 'Ensure the function throws the expected error';
        }
        return 'Verify the assertion matches the actual behavior';
      
      case 'Type Error':
        if (message.includes('Cannot read property')) {
          return 'Add null/undefined check before accessing properties';
        }
        if (message.includes('is not a function')) {
          return 'Verify the object has the expected method or import is correct';
        }
        return 'Check variable types and ensure proper initialization';
      
      case 'Reference Error':
        return 'Declare the variable before use or check for typos in variable name';
      
      case 'Timeout':
        return 'Increase test timeout or optimize async operations';
      
      case 'Test Setup Error':
        return 'Fix initialization in beforeEach/beforeAll hooks';
      
      case 'Test Teardown Error':
        return 'Fix cleanup logic in afterEach/afterAll hooks';
      
      default:
        return 'Review the error message and stack trace for details';
    }
  }
}