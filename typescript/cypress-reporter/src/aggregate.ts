import * as fs from 'fs';
import * as path from 'path';
import { 
  TestSuite, 
  TestResult, 
  ReporterContext,
  SummaryFormatter,
  DetailedFormatter,
  ConfigManager,
  OutputWriter,
  OutputMode
} from '@llm-test-reporter/shared-utilities';

interface JsonOutput {
  testSuites: TestSuite[];
  context: ReporterContext;
  exitCode: number;
  timestamp: string;
}

function aggregate(): void {
  const resultsDir = '.cypress-results';
  
  // Check if results directory exists
  if (!fs.existsSync(resultsDir)) {
    console.error(`[Cypress Aggregator] No results directory found at ${resultsDir}`);
    process.exit(1);
  }

  // Read all JSON files
  const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.error('[Cypress Aggregator] No JSON files found to aggregate');
    process.exit(1);
  }
  
  // Clean up old files first (remove any files older than 5 minutes)
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  files.forEach(file => {
    const filePath = path.join(resultsDir, file);
    const stats = fs.statSync(filePath);
    if (stats.mtimeMs < fiveMinutesAgo) {
      fs.unlinkSync(filePath);
    }
  });
  
  // Re-read files after cleanup
  const currentFiles = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));

  // Aggregate all results
  const aggregatedSuites: TestSuite[] = [];
  const aggregatedContext: ReporterContext = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    totalSuites: 0,
    passedSuites: 0,
    failedSuites: 0,
    duration: 0,
    startTime: Date.now()
  };
  
  let hasFailures = false;

  // Process each JSON file
  currentFiles.forEach(file => {
    const filePath = path.join(resultsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data: JsonOutput = JSON.parse(content);
    
    // Filter out empty "unknown" suites
    const validSuites = data.testSuites.filter(suite => 
      suite.filePath !== 'unknown' || suite.tests.length > 0
    );
    
    // Merge test suites
    aggregatedSuites.push(...validSuites);
    
    // Aggregate context
    aggregatedContext.totalTests += data.context.totalTests;
    aggregatedContext.passedTests += data.context.passedTests;
    aggregatedContext.failedTests += data.context.failedTests;
    aggregatedContext.skippedTests += data.context.skippedTests;
    aggregatedContext.duration += data.context.duration;
    
    if (data.exitCode !== 0) {
      hasFailures = true;
    }
  });

  // Recalculate suite counts
  aggregatedContext.totalSuites = aggregatedSuites.length;
  aggregatedSuites.forEach(suite => {
    const hasFailures = suite.tests.some(test => test.status === 'failed');
    if (hasFailures) {
      aggregatedContext.failedSuites++;
    } else {
      aggregatedContext.passedSuites++;
    }
  });

  // Get configuration from environment (check both variable names for compatibility)
  const mode = process.env.LLM_REPORTER_MODE || process.env.LLM_OUTPUT_MODE || 'summary';
  const includePassedSuites = process.env.LLM_INCLUDE_PASSED_SUITES === 'true';
  
  const config = new ConfigManager({
    mode: mode as OutputMode,
    includePassedSuites: includePassedSuites,
    maxValueLength: 100,
    detectPatterns: true
  });

  // Filter suites based on configuration
  const suitesToReport = includePassedSuites
    ? aggregatedSuites
    : aggregatedSuites.filter(suite => 
        suite.tests.some(test => test.status === 'failed')
      );

  // Format output
  const exitCode = hasFailures ? 1 : 0;
  let output: string;
  
  if (mode === 'summary') {
    output = SummaryFormatter.format(suitesToReport, aggregatedContext, exitCode);
  } else {
    output = DetailedFormatter.format(suitesToReport, aggregatedContext, exitCode, config.get('detectPatterns'));
  }

  // Write output to stdout directly
  process.stdout.write(output);

  // Clean up JSON files
  currentFiles.forEach(file => {
    fs.unlinkSync(path.join(resultsDir, file));
  });
  
  // Only remove directory if it's empty
  try {
    fs.rmdirSync(resultsDir);
  } catch (e) {
    // Directory might not be empty if new files were created during aggregation
  }

  // Exit with appropriate code
  process.exit(exitCode);
}

// Run aggregation
aggregate();