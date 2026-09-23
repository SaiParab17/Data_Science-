// DataWatch — Global Drift Store (Zustand)
// Shared state: drift result available to Dashboard, Alerts, Dataset Workspace
import { create } from "zustand";
import type { DriftResult } from "../types/drift";
import type { DataQualityResult } from "../types/quality";

interface DriftStore {
  result: DriftResult | null;
  qualityResult: DataQualityResult | null;
  isAnalyzing: boolean;
  error: string | null;
  setResult: (result: DriftResult) => void;
  setQualityResult: (quality: DataQualityResult) => void;
  setAnalyzing: (v: boolean) => void;
  setError: (e: string | null) => void;
  clearResult: () => void;
}

export const useDriftStore = create<DriftStore>((set) => ({
  result: null,
  qualityResult: null,
  isAnalyzing: false,
  error: null,

  setResult: (result) => set({
    result,
    qualityResult: result.quality ?? null,
    error: null,
  }),
  setQualityResult: (qualityResult) => set({ qualityResult, error: null }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setError: (e) => set({ error: e, isAnalyzing: false }),
  clearResult: () => set({ result: null, qualityResult: null, error: null }),
}));
