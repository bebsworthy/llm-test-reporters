import { defineConfig } from 'vitest/config';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const VitestLLMReporter = require('./dist/index.js').default;

export default defineConfig({
  test: {
    reporters: [
      new VitestLLMReporter({
        mode: process.env.LLM_REPORTER_MODE || 'summary',
        detectPatterns: true,
        maxValueLength: 200,
        outputFile: process.env.LLM_REPORTER_OUTPUT_FILE || undefined
      })
    ],
    testTimeout: 2000
  }
});