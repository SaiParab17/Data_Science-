// DataWatch — Drift Type Definitions

export type DriftStatus = "STABLE" | "WARNING" | "DRIFT";
export type DriftSeverity = "Stable" | "Moderate" | "High" | "Critical";
export type OverallDriftStatus = "NO_DRIFT" | "WARNING" | "DRIFT_DETECTED";

export interface HistogramBin {
  bin: string;
  binStart: number;
  binEnd: number;
  count: number;
  pct: number;
}

export interface FeatureDriftResult {
  column_name: string;
  data_type: "numeric" | "categorical";
  psi: number;
  ks_statistic?: number;
  ks_p_value?: number;
  wasserstein_distance?: number;
  js_divergence?: number;
  reference_mean?: number;
  current_mean?: number;
  reference_std?: number;
  current_std?: number;
  mean_change_percent?: number;
  reference_missing_pct: number;
  current_missing_pct: number;
  threshold: number;
  status: DriftStatus;
  severity: DriftSeverity;
  reference_histogram?: HistogramBin[];
  current_histogram?: HistogramBin[];
  reference_distribution?: Record<string, number>;
  current_distribution?: Record<string, number>;
}

export interface DriftAlert {
  alert_id: string;
  title: string;
  description: string;
  metric: string;
  observed_value: number;
  threshold: number;
  severity: DriftSeverity;
  dataset_name: string;
  column_name: string;
  run_id: string;
}

import type { DataQualityResult } from "./quality";

export interface DriftResult {
  dataset_name: string;
  reference_rows: number;
  current_rows: number;
  analyzed_columns: number;
  drifted_columns: number;
  warning_columns: number;
  stable_columns: number;
  max_psi: number;
  overall_status: OverallDriftStatus;
  psi_threshold: number;
  features: FeatureDriftResult[];
  alerts: DriftAlert[];
  analysis_timestamp: string;
  quality?: DataQualityResult;
}

export interface DriftAnalysisRequest {
  referenceFile: File;
  currentFile: File;
  psiThreshold?: number;
  datasetName?: string;
  runQuality?: boolean;
}
