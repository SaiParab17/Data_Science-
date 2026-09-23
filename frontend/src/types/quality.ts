// DataWatch — Data Quality Type Definitions
// Defines schemas for Great Expectations validation, dimensions, and deterministic scoring

export type QualityDimension = "completeness" | "uniqueness" | "validity" | "schema_compliance";
export type QualityStatus = "Good" | "Needs Attention" | "Poor";
export type ValidationCheckStatus = "PASSED" | "FAILED" | "WARNING";

export interface QualityCheckResult {
  check_id: string;
  check_name: string;
  dimension: QualityDimension;
  column_name: string | null;
  status: ValidationCheckStatus;
  observed_value: any;
  expected_condition: string;
  failure_message: string | null;
  unexpected_count: number;
  unexpected_percent: number;
  score: number;
}

export interface DimensionScore {
  dimension: QualityDimension;
  score: number;
  weight: number;
  passed_checks: number;
  failed_checks: number;
  total_checks: number;
}

export interface ScoreDeduction {
  dimension: QualityDimension;
  column_name: string | null;
  check_name: string;
  reason: string;
  points_deducted: number;
}

export interface DataQualityResult {
  dataset_name: string;
  overall_score: number;
  status: QualityStatus;
  dimensions: Record<QualityDimension, DimensionScore>;
  passed_checks: number;
  failed_checks: number;
  total_checks: number;
  checks: QualityCheckResult[];
  major_deductions: ScoreDeduction[];
  validation_timestamp: string;
}

export interface QualityValidationRequest {
  currentFile: File;
  referenceFile?: File;
  datasetName?: string;
  weights?: Partial<Record<QualityDimension, number>>;
}
