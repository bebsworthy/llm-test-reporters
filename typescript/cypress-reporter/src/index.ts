import { 
  ConfigManager, 
  OutputWriter, 
  SummaryFormatter,
  DetailedFormatter,
  TestSuite,
  TestResult,
  TestError,
  ErrorClassifier,
  OutputMode,
  ReporterContext
} from '@llm-test-reporter/shared-utilities';

interface CypressTest {
  title: string;
  fullTitle: string;
  state: 'passed' | 'failed' | 'pending' | 'skipped';
  duration?: number;
  err?: {
    message: string;
    stack?: string;
    actual?: any;
    expected?: any;
    codeFrame?: string;
    screenshot?: string;
    video?: string;
  };
  body?: string;
  file?: string;
  invocationDetails?: {
    relativeFile: string;
    absoluteFile: string;
    line?: number;
    column?: number;
    browser?: string;
  };
  commands?: Array<{
    name: string;
    args: any[];
    message?: string;
    state?: string;
    error?: any;
  }>;
}

interface CypressReporterOptions {
  mode?: 'summary' | 'detailed' | 'json';
  includePassedSuites?: boolean;
  maxValueLength?: number;
  outputFile?: string;
}

class CypressLLMReporter {
  private config: ConfigManager;
  private outputWriter: OutputWriter;
  private startTime: number = Date.now();
  private testSuites: TestSuite[] = [];
  private suiteMap: Map<string, TestSuite> = new Map();
  private context: ReporterContext;
  private isJsonMode: boolean = false;

  constructor(runner: any, options: { reporterOptions?: CypressReporterOptions }) {
    const reporterOptions = options.reporterOptions || {};
    
    // Initialize configuration
    const mode = reporterOptions.mode || process.env.LLM_OUTPUT_MODE as any || 'summary';
    this.isJsonMode = mode === 'json';
    
    this.config = new ConfigManager({
      mode: this.isJsonMode ? 'summary' : mode, // Use summary mode internally for JSON
      includePassedSuites: reporterOptions.includePassedSuites ?? false,
      maxValueLength: reporterOptions.maxValueLength ?? 100
    });

    this.outputWriter = new OutputWriter(reporterOptions.outputFile);

    this.context = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalSuites: 0,
      passedSuites: 0,
      failedSuites: 0,
      duration: 0,
      startTime: this.startTime
    };

    // Cypress Mocha events
    runner.on('suite', this.onSuite.bind(this));
    runner.on('suite end', this.onSuiteEnd.bind(this));
    runner.on('test', this.onTest.bind(this));
    runner.on('pass', this.onPass.bind(this));
    runner.on('fail', this.onFail.bind(this));
    runner.on('pending', this.onPending.bind(this));
    runner.on('end', this.onEnd.bind(this));
  }

  private onSuite(suite: any): void {
    if (suite.root) return;

    const filePath = suite.file || 'unknown';
    
    if (!this.suiteMap.has(filePath)) {
      const testSuite: TestSuite = {
        name: filePath,
        filePath: filePath,
        tests: [],
        duration: 0
      };
      this.suiteMap.set(filePath, testSuite);
      this.testSuites.push(testSuite);
    }
  }

  private onSuiteEnd(suite: any): void {
    // Suite end handling if needed
  }

  private onTest(test: any): void {
    // Test start handling if needed
  }

  private onPass(test: any): void {
    this.addTestResult(test, 'passed');
  }

  private onFail(test: any, err: any): void {
    this.addTestResult(test, 'failed', err);
  }

  private onPending(test: any): void {
    this.addTestResult(test, 'skipped');
  }

  private addTestResult(test: any, status: 'passed' | 'failed' | 'skipped', err?: any): void {
    const filePath = test.file || test.invocationDetails?.relativeFile || 'unknown';
    
    if (!this.suiteMap.has(filePath)) {
      const testSuite: TestSuite = {
        name: filePath,
        filePath: filePath,
        tests: [],
        duration: 0
      };
      this.suiteMap.set(filePath, testSuite);
      this.testSuites.push(testSuite);
    }

    const suite = this.suiteMap.get(filePath)!;
    
    // Build test path from parent titles
    const testPath = this.buildTestPath(test);
    
    const testResult: TestResult = {
      suite: suite.name,
      testPath: testPath,
      testName: test.title,
      status,
      duration: test.duration || 0
    };

    // Update context
    this.context.totalTests++;
    if (status === 'passed') {
      this.context.passedTests++;
    } else if (status === 'failed') {
      this.context.failedTests++;
    } else if (status === 'skipped') {
      this.context.skippedTests++;
    }

    if (status === 'failed' && err) {
      // Determine error type
      const errorType = ErrorClassifier.classify(err);
      
      // Extract line/column info
      const line = test.invocationDetails?.line || 0;
      const column = test.invocationDetails?.column;
      
      const error: TestError = {
        type: errorType,
        message: err.message || 'Test failed',
        stackTrace: err.stack,
        expected: this.formatValue(err.expected),
        received: this.formatValue(err.actual),
        file: filePath,
        line: line,
        column: column
      };

      // Add browser info if available
      if (test.invocationDetails?.browser) {
        error.browserName = test.invocationDetails.browser;
      }

      // Add screenshot/video paths if available (Cypress adds these to the error)
      if (err.screenshot) {
        error.screenshotPath = err.screenshot;
      }

      if (err.video) {
        error.videoPath = err.video;
      }

      // Add Cypress command log for failed tests in detailed mode
      if (this.config.get('mode') === OutputMode.DETAILED && test.commands && test.commands.length > 0) {
        // Get last few commands that led to the failure
        const relevantCommands = test.commands
          .slice(-10) // Last 10 commands
          .map((cmd: any) => {
            let cmdStr = `cy.${cmd.name}(`;
            if (cmd.args && cmd.args.length > 0) {
              cmdStr += cmd.args.map((arg: any) => 
                typeof arg === 'string' ? `'${arg}'` : JSON.stringify(arg)
              ).join(', ');
            }
            cmdStr += ')';
            if (cmd.message) {
              cmdStr += ` // ${cmd.message}`;
            }
            return cmdStr;
          });

        if (relevantCommands.length > 0) {
          // Add commands to stack trace
          error.stackTrace = (error.stackTrace || '') + 
            '\n\nCypress Commands:\n' + 
            relevantCommands.join('\n');
        }
      }

      testResult.error = error;
    }

    suite.tests.push(testResult);
    suite.duration = (suite.duration || 0) + (test.duration || 0);
  }

  private buildTestPath(test: any): string {
    const titles: string[] = [];
    let current = test.parent;
    
    while (current && !current.root) {
      titles.unshift(current.title);
      current = current.parent;
    }
    
    return titles.join(' > ');
  }

  private formatValue(value: any): string | undefined {
    if (value === undefined) return undefined;
    if (value === null) return 'null';
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }

  private onEnd(): void {
    const duration = (Date.now() - this.startTime) / 1000;
    this.context.duration = duration;
    this.context.totalSuites = this.testSuites.length;
    
    // Count passed/failed suites
    this.testSuites.forEach(suite => {
      const hasFailures = suite.tests.some(test => test.status === 'failed');
      if (hasFailures) {
        this.context.failedSuites++;
      } else {
        this.context.passedSuites++;
      }
    });
    
    // Filter suites based on configuration
    const suitesToReport = this.config.get('includePassedSuites')
      ? this.testSuites
      : this.testSuites.filter(suite => 
          suite.tests.some(test => test.status === 'failed')
        );

    const exitCode = this.context.failedTests > 0 ? 1 : 0;

    if (this.isJsonMode) {
      // Output JSON for aggregation
      const jsonData = {
        testSuites: this.testSuites,
        context: this.context,
        exitCode: exitCode,
        timestamp: new Date().toISOString()
      };
      
      // Generate unique filename for this spec run
      const specFile = this.testSuites.find(s => s.filePath !== 'unknown')?.filePath || 'unknown';
      const safeName = specFile.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const jsonFile = `.cypress-results/${safeName}_${Date.now()}.json`;
      
      // Ensure directory exists
      const fs = require('fs');
      const path = require('path');
      const dir = path.dirname(jsonFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));
      // Silent in JSON mode - aggregation script will handle output
    } else {
      // Format and write normal output
      const mode = this.config.get('mode');
      let output: string;
      
      if (mode === OutputMode.SUMMARY) {
        output = SummaryFormatter.format(suitesToReport, this.context, exitCode);
      } else {
        output = DetailedFormatter.format(suitesToReport, this.context, exitCode, this.config.get('detectPatterns'));
      }
      
      this.outputWriter.write(output);
    }
  }
}

export = CypressLLMReporter;