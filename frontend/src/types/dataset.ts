// DataWatch — Dataset & Platform Type Definitions

export type DatasetStatus = "Healthy" | "Warning" | "Attention Required" | "Running" | "Paused";
export type PipelineStatus = "Healthy" | "Running" | "Warning" | "Failed" | "Paused";
export type AlertSeverity = "Critical" | "High" | "Warning" | "Resolved";
export type AlertType = "drift" | "quality" | "schema" | "pipeline" | "model";

export interface Dataset {
  id: string;
  name: string;
  source: string;
  sourceType: "CSV" | "PostgreSQL" | "Snowflake" | "Kafka" | "S3";
  rows: number;
  rowsFormatted: string;
  features: number;
  status: DatasetStatus;
  qualityScore?: number;
  maxDriftPsi?: number;
  modelF1?: number;
  latestRun?: string;
  environment: "Production" | "Staging" | "Development";
  cadence: string;
  description: string;
  tags: string[];
  lastMonitored: string;
}

export interface PipelineStage {
  name: string;
  status: "success" | "warning" | "error" | "running" | "pending";
  latency: string;
}

export interface Pipeline {
  id: string;
  name: string;
  datasetId: string;
  datasetName: string;
  status: PipelineStatus;
  lastRun: string;
  lastRunId: string;
  duration: string;
  sla: string;
  stages: PipelineStage[];
  schedule: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  severity: AlertSeverity;
  dataset: string;
  datasetId: string;
  feature?: string;
  metric?: string;
  observedValue?: number;
  threshold?: number;
  timestamp: string;
  runId: string;
  status: "Open" | "Investigating" | "Resolved";
  source: "drift" | "quality" | "schema" | "pipeline";
  isFromApi?: boolean; // marks real API-generated alerts
}

export interface ValidationExpectation {
  id: string;
  expectation: string;
  status: "passed" | "failed" | "warning" | "skipped";
  observed?: string;
  expected?: string;
  column?: string;
}

export interface ValidationRun {
  runId: string;
  timestamp: string;
  status: "passed" | "failed" | "warning";
  passRate: number;
  totalExpectations: number;
  passed: number;
  failed: number;
  warning: number;
  skipped: number;
  duration: string;
  expectations: ValidationExpectation[];
}

export interface ColumnProfile {
  name: string;
  type: "numeric" | "categorical" | "identifier" | "boolean" | "datetime";
  missingPct: number;
  uniquePct: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  topCategories?: { value: string; pct: number }[];
}

export interface RunHistoryItem {
  runId: string;
  timestamp: string;
  status: "passed" | "failed" | "warning";
  rows: number;
  qualityScore: number;
  maxPsi: number;
  duration: string;
  triggerType: "scheduled" | "manual" | "api";
}
