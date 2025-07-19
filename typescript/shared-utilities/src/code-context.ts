/**
 * Code context extraction for detailed error reporting
 */

import * as fs from 'fs';
import { CodeContext } from './types';

export class CodeContextExtractor {
  private static readonly CONTEXT_LINES = 2; // Lines before and after error

  static extractContext(
    filePath: string, 
    errorLine: number, 
    errorColumn?: number
  ): CodeContext | null {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n');
      
      if (errorLine < 1 || errorLine > lines.length) {
        return null;
      }

      const startLine = Math.max(1, errorLine - this.CONTEXT_LINES);
      const endLine = Math.min(lines.length, errorLine + this.CONTEXT_LINES);
      
      const contextLines: CodeContext['lines'] = [];
      
      for (let i = startLine; i <= endLine; i++) {
        contextLines.push({
          number: i,
          content: lines[i - 1], // Convert to 0-based index
          isError: i === errorLine
        });
      }

      return {
        lines: contextLines,
        errorColumn
      };
    } catch (error) {
      // File might not exist or be readable
      return null;
    }
  }

  static formatContext(context: CodeContext): string[] {
    const lines: string[] = [];
    const maxLineNumWidth = Math.max(
      ...context.lines.map(l => l.number.toString().length)
    );

    for (const line of context.lines) {
      const prefix = line.isError ? '>' : ' ';
      const lineNumStr = line.number.toString().padStart(maxLineNumWidth, ' ');
      lines.push(`${prefix} ${lineNumStr} | ${line.content}`);
      
      // Add error pointer if this is the error line and we have column info
      if (line.isError && context.errorColumn !== undefined) {
        const pointerLine = ' '.repeat(maxLineNumWidth + 3) + '|' + 
          ' '.repeat(context.errorColumn) + '^';
        lines.push(pointerLine);
      }
    }

    return lines;
  }

  static extractLineAndColumn(stackTrace: string): { line: number; column?: number } | null {
    // Common stack trace patterns
    const patterns = [
      // Node.js: at Object.<anonymous> (/path/to/file.js:10:5)
      /:(\d+):(\d+)\)$/,
      // Browser: at file:///path/to/file.js:10:5
      /:(\d+):(\d+)$/,
      // Simple: /path/to/file.js:10
      /:(\d+)$/
    ];

    for (const pattern of patterns) {
      const match = stackTrace.match(pattern);
      if (match) {
        const line = parseInt(match[1], 10);
        const column = match[2] ? parseInt(match[2], 10) : undefined;
        return { line, column };
      }
    }

    return null;
  }

  static findErrorLocation(error: Error | any, testFilePath: string): { line: number; column?: number } | null {
    if (!error.stack) return null;

    const stackLines = error.stack.split('\n');
    
    // Find the first stack frame from the test file
    for (const stackLine of stackLines) {
      if (stackLine.includes(testFilePath)) {
        const location = this.extractLineAndColumn(stackLine);
        if (location) return location;
      }
    }

    return null;
  }
}