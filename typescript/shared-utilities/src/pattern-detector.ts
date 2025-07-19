/**
 * Pattern detection for common test failures
 */

import { TestResult, ErrorPattern, ErrorType } from './types';

export class PatternDetector {
  private static readonly MIN_PATTERN_COUNT = 2;

  static detectPatterns(failedTests: TestResult[]): ErrorPattern[] {
    const patterns: ErrorPattern[] = [];
    
    // Group by error type
    const errorTypePatterns = this.detectErrorTypePatterns(failedTests);
    patterns.push(...errorTypePatterns);

    // Group by similar error messages
    const messagePatterns = this.detectMessagePatterns(failedTests);
    patterns.push(...messagePatterns);

    // Group by file/module
    const modulePatterns = this.detectModulePatterns(failedTests);
    patterns.push(...modulePatterns);

    // Sort by count descending
    return patterns
      .filter(p => p.count >= this.MIN_PATTERN_COUNT)
      .sort((a, b) => b.count - a.count);
  }

  private static detectErrorTypePatterns(failedTests: TestResult[]): ErrorPattern[] {
    const typeGroups = new Map<ErrorType, TestResult[]>();

    for (const test of failedTests) {
      if (!test.error) continue;
      
      const existing = typeGroups.get(test.error.type) || [];
      existing.push(test);
      typeGroups.set(test.error.type, existing);
    }

    const patterns: ErrorPattern[] = [];
    for (const [type, tests] of typeGroups) {
      if (tests.length >= this.MIN_PATTERN_COUNT) {
        patterns.push({
          pattern: `error_type:${type}`,
          count: tests.length,
          description: this.getErrorTypePatternDescription(type),
          affectedTests: tests.map(t => `${t.suite} > ${t.testName}`)
        });
      }
    }

    return patterns;
  }

  private static detectMessagePatterns(failedTests: TestResult[]): ErrorPattern[] {
    const messageGroups = new Map<string, TestResult[]>();

    for (const test of failedTests) {
      if (!test.error) continue;
      
      // Extract common patterns from error messages
      const patterns = this.extractMessagePatterns(test.error.message);
      
      for (const pattern of patterns) {
        const existing = messageGroups.get(pattern) || [];
        existing.push(test);
        messageGroups.set(pattern, existing);
      }
    }

    const patterns: ErrorPattern[] = [];
    for (const [pattern, tests] of messageGroups) {
      if (tests.length >= this.MIN_PATTERN_COUNT) {
        patterns.push({
          pattern: `message:${pattern}`,
          count: tests.length,
          description: this.getMessagePatternDescription(pattern),
          affectedTests: tests.map(t => `${t.suite} > ${t.testName}`)
        });
      }
    }

    return patterns;
  }

  private static detectModulePatterns(failedTests: TestResult[]): ErrorPattern[] {
    const moduleGroups = new Map<string, TestResult[]>();

    for (const test of failedTests) {
      // Extract module name from file path
      const module = this.extractModuleName(test.testPath);
      
      const existing = moduleGroups.get(module) || [];
      existing.push(test);
      moduleGroups.set(module, existing);
    }

    const patterns: ErrorPattern[] = [];
    for (const [module, tests] of moduleGroups) {
      if (tests.length >= this.MIN_PATTERN_COUNT) {
        patterns.push({
          pattern: `module:${module}`,
          count: tests.length,
          description: `Multiple failures in ${module} module`,
          affectedTests: tests.map(t => `${t.suite} > ${t.testName}`)
        });
      }
    }

    return patterns;
  }

  private static extractMessagePatterns(message: string): string[] {
    const patterns: string[] = [];

    // Common validation patterns
    if (message.includes('validation') || message.includes('validate')) {
      patterns.push('validation_error');
    }

    // Missing property patterns
    if (message.includes('Cannot read property') || message.includes('undefined')) {
      patterns.push('missing_property');
    }

    // Type mismatch patterns
    if (message.includes('Expected') && message.includes('Received')) {
      patterns.push('expectation_mismatch');
    }

    // Network/API patterns
    if (message.includes('ECONNREFUSED') || message.includes('fetch') || message.includes('axios')) {
      patterns.push('network_error');
    }

    // Database patterns
    if (message.includes('database') || message.includes('connection') || message.includes('query')) {
      patterns.push('database_error');
    }

    return patterns;
  }

  private static extractModuleName(filePath: string): string {
    // Extract module name from path
    // e.g., /src/services/user.test.ts -> services
    const parts = filePath.split('/');
    const srcIndex = parts.indexOf('src');
    
    if (srcIndex >= 0 && srcIndex < parts.length - 2) {
      return parts[srcIndex + 1];
    }
    
    // Fallback to parent directory
    return parts[parts.length - 2] || 'unknown';
  }

  private static getErrorTypePatternDescription(type: ErrorType): string {
    switch (type) {
      case ErrorType.ASSERTION_ERROR:
        return 'Multiple assertion failures';
      case ErrorType.TYPE_ERROR:
        return 'Multiple type-related errors';
      case ErrorType.REFERENCE_ERROR:
        return 'Multiple reference errors';
      case ErrorType.TIMEOUT:
        return 'Multiple timeout failures';
      case ErrorType.TEST_SETUP_ERROR:
        return 'Multiple test setup failures';
      case ErrorType.TEST_TEARDOWN_ERROR:
        return 'Multiple test teardown failures';
      default:
        return 'Multiple similar errors';
    }
  }

  private static getMessagePatternDescription(pattern: string): string {
    switch (pattern) {
      case 'validation_error':
        return 'Multiple validation failures';
      case 'missing_property':
        return 'Multiple missing property errors';
      case 'expectation_mismatch':
        return 'Multiple expectation mismatches';
      case 'network_error':
        return 'Multiple network-related failures';
      case 'database_error':
        return 'Multiple database-related failures';
      default:
        return 'Multiple similar error messages';
    }
  }

  static getSuggestedFocusAreas(patterns: ErrorPattern[]): string[] {
    const suggestions: string[] = [];
    
    for (const pattern of patterns) {
      if (pattern.pattern.includes('validation_error')) {
        suggestions.push('Implement input validation layer for all service methods');
      } else if (pattern.pattern.includes('missing_property')) {
        suggestions.push('Add null/undefined checks before property access');
      } else if (pattern.pattern.includes('network_error')) {
        suggestions.push('Check network connectivity and API endpoint availability');
      } else if (pattern.pattern.includes('database_error')) {
        suggestions.push('Verify database connection settings and availability');
      } else if (pattern.pattern.includes('error_type:' + ErrorType.TIMEOUT)) {
        suggestions.push('Review async operations and consider increasing timeouts');
      } else if (pattern.pattern.includes('error_type:' + ErrorType.TEST_SETUP_ERROR)) {
        suggestions.push('Fix test setup hooks to ensure proper initialization');
      }
    }

    // Remove duplicates and limit to top suggestions
    return [...new Set(suggestions)].slice(0, 5);
  }
}