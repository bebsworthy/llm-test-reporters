/**
 * Core types for LLM-optimized test reporters
 */

export enum OutputMode {
  SUMMARY = 'summary',
  DETAILED = 'detailed'
}

export enum ErrorType {
  ASSERTION_ERROR = 'Assertion Error',
  TYPE_ERROR = 'Type Error',
  REFERENCE_ERROR = 'Reference Error',
  TIMEOUT = 'Timeout',
  TEST_SETUP_ERROR = 'Test Setup Error',
  TEST_TEARDOWN_ERROR = 'Test Teardown Error'
}

export interface TestError {
  type: ErrorType;
  message: string;
  expected?: string;
  received?: string;
  file: string;
  line: number;
  column?: number;
  stackTrace?: string;
  timeout?: number;
}

export interface TestResult {
  suite: string;
  testPath: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: TestError;
}

export interface TestSuite {
  name: string;
  filePath: string;
  tests: TestResult[];
  duration: number;
}

export interface ReporterConfig {
  mode: OutputMode;
  maxValueLength: number;
  stackTraceLines: number;
  detectPatterns: boolean;
  outputFile?: string;
  includePassedSuites: boolean;
}

export interface ReporterContext {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  duration: number;
  startTime: number;
}

export interface ErrorPattern {
  pattern: string;
  count: number;
  description: string;
  affectedTests: string[];
}

export interface CodeContext {
  lines: Array<{
    number: number;
    content: string;
    isError: boolean;
  }>;
  errorColumn?: number;
}

export const DEFAULT_CONFIG: ReporterConfig = {
  mode: OutputMode.SUMMARY,
  maxValueLength: 200,
  stackTraceLines: 0,
  detectPatterns: true,
  includePassedSuites: false
};