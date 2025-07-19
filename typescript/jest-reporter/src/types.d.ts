/**
 * Type extensions for Jest test results
 */

import '@jest/test-result';

declare module '@jest/test-result' {
  interface AssertionResult {
    ancestorTitles?: Array<string>;
  }
}