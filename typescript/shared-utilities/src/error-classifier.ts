/**
 * Error classification utilities
 */

import { ErrorType, TestError } from './types';

export class ErrorClassifier {
  static classify(error: Error | any): ErrorType {
    const message = error.message || error.toString();
    const name = error.name || '';
    const stack = error.stack || '';

    // Check for timeout errors
    if (
      message.includes('exceeded timeout') ||
      message.includes('Timeout') ||
      message.includes('Async callback was not invoked within') ||
      name === 'TimeoutError'
    ) {
      return ErrorType.TIMEOUT;
    }

    // Check for setup/teardown errors
    if (
      message.includes('beforeEach') ||
      message.includes('beforeAll') ||
      stack.includes('beforeEach') ||
      stack.includes('beforeAll')
    ) {
      return ErrorType.TEST_SETUP_ERROR;
    }

    if (
      message.includes('afterEach') ||
      message.includes('afterAll') ||
      stack.includes('afterEach') ||
      stack.includes('afterAll')
    ) {
      return ErrorType.TEST_TEARDOWN_ERROR;
    }

    // Check for type errors
    if (
      name === 'TypeError' ||
      message.includes('Cannot read property') ||
      message.includes('Cannot read properties') ||
      message.includes('is not a function') ||
      message.includes('is not defined') ||
      message.includes('undefined is not') ||
      message.includes('null is not')
    ) {
      return ErrorType.TYPE_ERROR;
    }

    // Check for reference errors
    if (
      name === 'ReferenceError' ||
      message.includes('is not defined') ||
      message.includes('not found')
    ) {
      return ErrorType.REFERENCE_ERROR;
    }

    // Default to assertion error
    return ErrorType.ASSERTION_ERROR;
  }

  static extractErrorDetails(error: Error | any, filePath: string): Omit<TestError, 'file' | 'line'> {
    const type = this.classify(error);
    const message = this.cleanErrorMessage(error.message || error.toString());
    
    const details: Omit<TestError, 'file' | 'line'> = {
      type,
      message
    };

    // Extract expected/received for assertion errors
    if (type === ErrorType.ASSERTION_ERROR) {
      const expectedMatch = message.match(/[Ee]xpected:?\s*(.+?)(?:\n|$|,\s*[Rr]eceived)/);
      const receivedMatch = message.match(/[Rr]eceived:?\s*(.+?)(?:\n|$)/);
      
      if (expectedMatch) details.expected = expectedMatch[1].trim();
      if (receivedMatch) details.received = receivedMatch[1].trim();

      // Also check for Jest's expect format
      if (error.matcherResult) {
        details.expected = error.matcherResult.expected;
        details.received = error.matcherResult.actual;
      }
    }

    // Extract timeout value
    if (type === ErrorType.TIMEOUT) {
      const timeoutMatch = message.match(/(\d+)\s*ms/);
      if (timeoutMatch) {
        details.timeout = parseInt(timeoutMatch[1], 10);
      }
    }

    // Clean stack trace if needed
    if (error.stack) {
      details.stackTrace = this.cleanStackTrace(error.stack, filePath);
    }

    return details;
  }

  private static cleanErrorMessage(message: string): string {
    // Remove common prefixes
    return message
      .replace(/^Error:\s*/i, '')
      .replace(/^AssertionError:\s*/i, '')
      .replace(/^TypeError:\s*/i, '')
      .replace(/^ReferenceError:\s*/i, '')
      .trim();
  }

  private static cleanStackTrace(stack: string, testFilePath: string): string {
    const lines = stack.split('\n');
    const cleaned: string[] = [];
    
    for (const line of lines) {
      // Skip node internals and test runner frames
      if (
        line.includes('node_modules') ||
        line.includes('internal/') ||
        line.includes('processTicksAndRejections')
      ) {
        continue;
      }
      
      // Keep lines from the test file
      if (line.includes(testFilePath)) {
        cleaned.push(line.trim());
      }
    }
    
    return cleaned.join('\n');
  }

  static getErrorTypeDescription(type: ErrorType): string {
    switch (type) {
      case ErrorType.ASSERTION_ERROR:
        return 'Test expectation failed';
      case ErrorType.TYPE_ERROR:
        return 'Type-related error occurred';
      case ErrorType.REFERENCE_ERROR:
        return 'Referenced variable or property not found';
      case ErrorType.TIMEOUT:
        return 'Test exceeded time limit';
      case ErrorType.TEST_SETUP_ERROR:
        return 'Error in test setup phase';
      case ErrorType.TEST_TEARDOWN_ERROR:
        return 'Error in test cleanup phase';
      default:
        return 'Unknown error type';
    }
  }
}