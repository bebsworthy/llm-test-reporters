/**
 * Jest-specific configuration extensions
 */

import { ReporterConfig } from '@llm-reporters/shared-utilities';

export interface JestReporterConfig extends ReporterConfig {
  // Jest-specific options
  includeSnapshotDetails?: boolean;
  includeConsoleOutput?: boolean;
  groupByDescribe?: boolean;
  showTestPath?: boolean;
}

export const JEST_DEFAULT_CONFIG: Partial<JestReporterConfig> = {
  includeSnapshotDetails: false,
  includeConsoleOutput: false,
  groupByDescribe: true,
  showTestPath: true
};