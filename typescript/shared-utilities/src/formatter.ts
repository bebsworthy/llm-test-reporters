/**
 * Base formatter utilities for all output modes
 */

import { TestSuite, TestResult, ReporterContext, OutputMode, ErrorType } from './types';

export class Formatter {
  static readonly HEADER_SUMMARY = '# LLM TEST REPORTER - SUMMARY MODE';
  static readonly HEADER_DETAILED = '# LLM TEST REPORTER - DETAILED MODE';
  static readonly SEPARATOR = '---';

  static truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength - 3) + '...';
  }

  static formatDuration(ms: number): string {
    return (ms / 1000).toFixed(2) + 's';
  }

  static formatTestHierarchy(testName: string): string {
    // Test name should already be properly formatted with ' > ' separators
    // Just return it as-is
    return testName;
  }

  static formatFilePath(filePath: string, line?: number): string {
    if (line !== undefined && line > 0) {
      return `${filePath}:${line}`;
    }
    return filePath;
  }

  static formatErrorFirstLine(error: string): string {
    const firstLine = error.split('\n')[0];
    return this.truncate(firstLine, 80);
  }

  static getSummaryHeader(mode: OutputMode): string {
    return mode === OutputMode.SUMMARY ? this.HEADER_SUMMARY : this.HEADER_DETAILED;
  }

  static formatSummarySection(context: ReporterContext, exitCode: number): string {
    const lines = [
      '## SUMMARY',
      `- PASSED SUITES: ${context.passedSuites}`,
      `- FAILED SUITES: ${context.failedSuites}`,
      `- TOTAL TESTS: ${context.totalTests} (${context.passedTests} passed, ${context.failedTests} failed)`,
      `- DURATION: ${this.formatDuration(context.duration)}`,
      `- EXIT CODE: ${exitCode}`
    ];

    return lines.join('\n');
  }

  static formatDetailedSummarySection(context: ReporterContext, exitCode: number): string {
    const failureRate = context.totalTests > 0 
      ? ((context.failedTests / context.totalTests) * 100).toFixed(2)
      : '0.00';

    const lines = [
      '## SUMMARY',
      `- TOTAL TESTS: ${context.totalTests} (${context.passedTests} passed, ${context.failedTests} failed)`,
      `- FAILURE RATE: ${failureRate}%`,
      `- DURATION: ${this.formatDuration(context.duration)}`,
      `- EXIT CODE: ${exitCode}`
    ];

    return lines.join('\n');
  }

  static indent(text: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return text.split('\n').map(line => indent + line).join('\n');
  }

  static formatCodeLine(lineNumber: number, content: string, maxLineNumWidth: number = 4): string {
    const lineNumStr = lineNumber.toString().padStart(maxLineNumWidth, ' ');
    return `${lineNumStr} | ${content}`;
  }

  static stripAnsiCodes(text: string): string {
    // Remove all ANSI escape codes
    return text.replace(/\u001b\[[0-9;]*m/g, '');
  }

  static ensureNoAnsiCodes(text: string): string {
    return this.stripAnsiCodes(text);
  }
}