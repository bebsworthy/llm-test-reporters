/**
 * Summary mode formatter implementation
 */

import { TestSuite, TestResult, ReporterContext, OutputMode } from './types';
import { Formatter } from './formatter';

export class SummaryFormatter {
  static format(
    suites: TestSuite[], 
    context: ReporterContext,
    exitCode: number
  ): string {
    const lines: string[] = [];
    
    // Add leading newline to separate from Jest output
    lines.push('');
    
    // Header
    lines.push(Formatter.HEADER_SUMMARY);
    lines.push('');

    // Filter to only failed suites
    const failedSuites = suites.filter(suite => 
      suite.tests.some(test => test.status === 'failed')
    );

    // Format each failed suite
    for (let i = 0; i < failedSuites.length; i++) {
      if (i > 0) {
        lines.push(Formatter.SEPARATOR);
      }
      
      const suite = failedSuites[i];
      lines.push(`SUITE: ${suite.filePath}`);
      lines.push('FAILED TESTS:');
      
      // List failed tests
      const failedTests = suite.tests.filter(test => test.status === 'failed');
      for (const test of failedTests) {
        const errorLine = test.error 
          ? Formatter.formatErrorFirstLine(test.error.message)
          : 'Unknown error';
        lines.push(`- ${test.testName}: ${errorLine}`);
      }
      
      lines.push('');
    }

    // Summary section
    lines.push(Formatter.SEPARATOR);
    lines.push(Formatter.formatSummarySection(context, exitCode));

    return Formatter.ensureNoAnsiCodes(lines.join('\n'));
  }

  static formatSingleSuite(suite: TestSuite): string[] {
    const lines: string[] = [];
    
    lines.push(`SUITE: ${suite.filePath}`);
    lines.push('FAILED TESTS:');
    
    const failedTests = suite.tests.filter(test => test.status === 'failed');
    for (const test of failedTests) {
      const hierarchy = Formatter.formatTestHierarchy(test.testName);
      const errorLine = test.error 
        ? Formatter.formatErrorFirstLine(test.error.message)
        : 'Unknown error';
      lines.push(`- ${suite.name} > ${hierarchy}: ${errorLine}`);
    }
    
    return lines;
  }
}