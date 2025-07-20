/**
 * Configuration management for LLM reporters
 */

import { ReporterConfig, OutputMode, DEFAULT_CONFIG } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class ConfigManager {
  private config: ReporterConfig;

  constructor(defaultConfig: Partial<ReporterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...defaultConfig };
    this.loadFromEnvironment();
    this.loadFromFile();
  }

  private loadFromEnvironment(): void {
    const env = process.env;

    // Check both LLM_REPORTER_MODE and LLM_OUTPUT_MODE for compatibility
    const modeValue = env.LLM_REPORTER_MODE || env.LLM_OUTPUT_MODE;
    if (modeValue) {
      const mode = modeValue.toLowerCase();
      if (mode === 'summary' || mode === 'detailed') {
        this.config.mode = mode as OutputMode;
      }
    }

    if (env.LLM_REPORTER_MAX_VALUE_LENGTH) {
      const length = parseInt(env.LLM_REPORTER_MAX_VALUE_LENGTH, 10);
      if (!isNaN(length) && length > 0) {
        this.config.maxValueLength = length;
      }
    }

    if (env.LLM_REPORTER_STACK_TRACE_LINES) {
      const lines = parseInt(env.LLM_REPORTER_STACK_TRACE_LINES, 10);
      if (!isNaN(lines) && lines >= 0) {
        this.config.stackTraceLines = lines;
      }
    }

    if (env.LLM_REPORTER_DETECT_PATTERNS) {
      this.config.detectPatterns = env.LLM_REPORTER_DETECT_PATTERNS.toLowerCase() !== 'false';
    }

    if (env.LLM_REPORTER_OUTPUT_FILE) {
      this.config.outputFile = env.LLM_REPORTER_OUTPUT_FILE;
    }
  }

  private loadFromFile(): void {
    const configPath = this.findConfigFile();
    if (!configPath) return;

    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(configContent);
      
      // Merge file config with existing config
      this.config = { ...this.config, ...fileConfig };
    } catch (error) {
      // Silently ignore config file errors
    }
  }

  private findConfigFile(): string | null {
    const configFiles = ['.llm-reporter.json', '.llm-reporter.config.json'];
    let currentDir = process.cwd();

    while (currentDir !== path.dirname(currentDir)) {
      for (const configFile of configFiles) {
        const configPath = path.join(currentDir, configFile);
        if (fs.existsSync(configPath)) {
          return configPath;
        }
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  getConfig(): ReporterConfig {
    return { ...this.config };
  }

  get<K extends keyof ReporterConfig>(key: K): ReporterConfig[K] {
    return this.config[key];
  }
}