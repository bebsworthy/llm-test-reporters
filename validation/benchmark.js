#!/usr/bin/env node

/**
 * Performance benchmarking for LLM test reporters
 * Compares reporter overhead against native reporters
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ReporterBenchmark {
  constructor(options = {}) {
    this.options = {
      iterations: options.iterations || 5,
      warmup: options.warmup || 2,
      outputDir: options.outputDir || path.join(__dirname, 'benchmark-results'),
      verbose: options.verbose || false
    };

    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  /**
   * Run a single benchmark iteration
   */
  async runIteration(reporterPath, reporterConfig, isNative = false) {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        NODE_ENV: 'production'
      };

      const configFile = isNative ? 'jest.config.js' : 'jest.example.config.js';
      const child = spawn('npx', ['jest', `--config=${configFile}`, '--no-cache'], {
        cwd: reporterPath,
        env,
        stdio: this.options.verbose ? 'inherit' : 'pipe'
      });

      let stdout = '';
      let stderr = '';

      if (!this.options.verbose) {
        child.stdout.on('data', (data) => stdout += data);
        child.stderr.on('data', (data) => stderr += data);
      }

      child.on('close', (code) => {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        
        const duration = Number(endTime - startTime) / 1_000_000; // Convert to ms
        const memoryDelta = {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          rss: endMemory.rss - startMemory.rss
        };

        resolve({
          duration,
          memory: memoryDelta,
          exitCode: code,
          stdout: stdout.length,
          stderr: stderr.length
        });
      });

      child.on('error', reject);
    });
  }

  /**
   * Run benchmark for a reporter
   */
  async benchmarkReporter(reporterInfo) {
    const { framework, reporterPath, name } = reporterInfo;
    console.log(`\nBenchmarking ${name}...`);

    const results = {
      framework,
      name,
      iterations: [],
      summary: {}
    };

    // Warmup runs
    console.log('Running warmup iterations...');
    for (let i = 0; i < this.options.warmup; i++) {
      await this.runIteration(reporterPath, reporterInfo, name === 'native');
    }

    // Actual benchmark runs
    console.log('Running benchmark iterations...');
    for (let i = 0; i < this.options.iterations; i++) {
      if (this.options.verbose) {
        console.log(`  Iteration ${i + 1}/${this.options.iterations}`);
      }
      
      const result = await this.runIteration(reporterPath, reporterInfo, name === 'native');
      results.iterations.push(result);
      
      process.stdout.write('.');
    }
    console.log();

    // Calculate summary statistics
    results.summary = this.calculateSummary(results.iterations);
    return results;
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary(iterations) {
    const durations = iterations.map(i => i.duration);
    const memoryUsages = iterations.map(i => i.memory.heapUsed);
    
    return {
      duration: {
        mean: this.mean(durations),
        median: this.median(durations),
        min: Math.min(...durations),
        max: Math.max(...durations),
        stdDev: this.stdDev(durations)
      },
      memory: {
        mean: this.mean(memoryUsages),
        median: this.median(memoryUsages),
        min: Math.min(...memoryUsages),
        max: Math.max(...memoryUsages)
      },
      outputSize: {
        stdout: this.mean(iterations.map(i => i.stdout)),
        stderr: this.mean(iterations.map(i => i.stderr))
      }
    };
  }

  /**
   * Compare reporter performance
   */
  compareResults(results) {
    const native = results.find(r => r.name === 'native');
    if (!native) {
      console.warn('No native reporter results for comparison');
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('Performance Comparison');
    console.log('='.repeat(60));
    console.log();

    for (const result of results) {
      if (result.name === 'native') continue;

      const overhead = {
        duration: ((result.summary.duration.mean - native.summary.duration.mean) / native.summary.duration.mean * 100).toFixed(2),
        memory: ((result.summary.memory.mean - native.summary.memory.mean) / native.summary.memory.mean * 100).toFixed(2),
        outputReduction: ((native.summary.outputSize.stdout - result.summary.outputSize.stdout) / native.summary.outputSize.stdout * 100).toFixed(2)
      };

      console.log(`${result.name}:`);
      console.log(`  Duration: ${result.summary.duration.mean.toFixed(2)}ms (${overhead.duration}% overhead)`);
      console.log(`  Memory: ${(result.summary.memory.mean / 1024 / 1024).toFixed(2)}MB (${overhead.memory}% overhead)`);
      console.log(`  Output reduction: ${overhead.outputReduction}%`);
      console.log();
    }
  }

  /**
   * Statistical helper functions
   */
  mean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  median(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  stdDev(values) {
    const avg = this.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  /**
   * Save results to file
   */
  saveResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-${timestamp}.json`;
    const filepath = path.join(this.options.outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${filepath}`);
  }
}

// Reporter configurations
const REPORTERS = [
  {
    framework: 'jest',
    name: 'native',
    reporterPath: path.join(__dirname, '../typescript/jest-reporter'),
    description: 'Native Jest reporter (baseline)'
  },
  {
    framework: 'jest',
    name: 'llm-summary',
    reporterPath: path.join(__dirname, '../typescript/jest-reporter'),
    description: 'LLM reporter in summary mode',
    env: { LLM_REPORTER_MODE: 'summary' }
  },
  {
    framework: 'jest',
    name: 'llm-detailed',
    reporterPath: path.join(__dirname, '../typescript/jest-reporter'),
    description: 'LLM reporter in detailed mode',
    env: { LLM_REPORTER_MODE: 'detailed' }
  }
];

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    iterations: parseInt(args.find(a => a.startsWith('--iterations='))?.split('=')[1] || '5'),
    warmup: parseInt(args.find(a => a.startsWith('--warmup='))?.split('=')[1] || '2'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  const benchmark = new ReporterBenchmark(options);

  console.log('LLM Test Reporter Performance Benchmark');
  console.log('=======================================');
  console.log(`Iterations: ${options.iterations} (with ${options.warmup} warmup runs)`);

  (async () => {
    const results = [];
    
    for (const reporter of REPORTERS) {
      try {
        const result = await benchmark.benchmarkReporter(reporter);
        results.push(result);
      } catch (error) {
        console.error(`Failed to benchmark ${reporter.name}:`, error.message);
      }
    }

    benchmark.compareResults(results);
    benchmark.saveResults(results);

    // Check performance requirements
    const llmSummary = results.find(r => r.name === 'llm-summary');
    if (llmSummary && llmSummary.summary.duration.mean > 100) {
      console.warn('\n⚠️  Warning: LLM reporter exceeds 100ms overhead target');
      process.exit(1);
    } else {
      console.log('\n✅ Performance requirements met');
    }
  })().catch(console.error);
}