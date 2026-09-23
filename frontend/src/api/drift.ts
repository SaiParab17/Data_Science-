import apiClient from "./client";
import type { DriftResult, DriftAlert, DriftAnalysisRequest } from "../types/drift";
import type { DataQualityResult, QualityValidationRequest } from "../types/quality";

/**
 * Analyze distribution drift between reference and current CSV files.
 * Optionally runs Great Expectations quality validation alongside drift.
 * Sends multipart/form-data to POST /api/drift/analyze.
 */
export async function analyzeDrift(request: DriftAnalysisRequest): Promise<DriftResult> {
  const formData = new FormData();
  formData.append("reference_file", request.referenceFile);
  formData.append("current_file", request.currentFile);
  formData.append("psi_threshold", String(request.psiThreshold ?? 0.25));
  formData.append("dataset_name", request.datasetName ?? "Telco Customer Churn");
  formData.append("run_quality", String(request.runQuality ?? true));

  const response = await apiClient.post<DriftResult>("/api/drift/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/**
 * Run standalone Great Expectations quality validation and deterministic scoring.
 * Sends multipart/form-data to POST /api/quality/validate.
 */
export async function validateQuality(request: QualityValidationRequest): Promise<DataQualityResult> {
  const formData = new FormData();
  formData.append("current_file", request.currentFile);
  if (request.referenceFile) {
    formData.append("reference_file", request.referenceFile);
  }
  formData.append("dataset_name", request.datasetName ?? "Dataset");
  if (request.weights) {
    formData.append("weights_json", JSON.stringify(request.weights));
  }

  const response = await apiClient.post<DataQualityResult>("/api/quality/validate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/**
 * Get the latest cached quality validation result.
 */
export async function getLatestQuality(): Promise<DataQualityResult | null> {
  const response = await apiClient.get<DataQualityResult | null>("/api/quality/latest");
  return response.data;
}

/**
 * Get the latest cached drift result (for dashboard/alerts).
 */
export async function getLatestDrift(): Promise<DriftResult | null> {
  const response = await apiClient.get<DriftResult | null>("/api/drift/latest");
  return response.data;
}

/**
 * Get drift alerts from the latest analysis.
 */
export async function getDriftAlerts(): Promise<DriftAlert[]> {
  const response = await apiClient.get<DriftAlert[]>("/api/alerts");
  return response.data;
}

/**
 * Check backend health.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    await apiClient.get("/api/health");
    return true;
  } catch {
    return false;
  }
}
