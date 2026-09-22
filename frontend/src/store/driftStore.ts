// DataWatch — Global Drift Store (Zustand)
// Shared state: drift result available to Dashboard, Alerts, Dataset Workspace
import { create } from "zustand";
import type { DriftResult } from "../types/drift";

interface DriftStore {
  result: DriftResult | null;
  isAnalyzing: boolean;
  error: string | null;
  setResult: (result: DriftResult) => void;
  setAnalyzing: (v: boolean) => void;
  setError: (e: string | null) => void;
  clearResult: () => void;
}

export const useDriftStore = create<DriftStore>((set) => ({
  result: null,
  isAnalyzing: false,
  error: null,

  setResult: (result) => set({ result, error: null }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setError: (e) => set({ error: e, isAnalyzing: false }),
  clearResult: () => set({ result: null, error: null }),
}));
