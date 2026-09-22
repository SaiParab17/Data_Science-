// DataWatch — Drift API Service
import apiClient from "./client";
import type { DriftResult, DriftAlert, DriftAnalysisRequest } from "../types/drift";

/**
 * Analyze distribution drift between reference and current CSV files.
 * Sends multipart/form-data to POST /api/drift/analyze.
 */
export async function analyzeDrift(request: DriftAnalysisRequest): Promise<DriftResult> {
  const formData = new FormData();
  formData.append("reference_file", request.referenceFile);
  formData.append("current_file", request.currentFile);
  formData.append("psi_threshold", String(request.psiThreshold ?? 0.25));
  formData.append("dataset_name", request.datasetName ?? "Telco Customer Churn");

  const response = await apiClient.post<DriftResult>("/api/drift/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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
