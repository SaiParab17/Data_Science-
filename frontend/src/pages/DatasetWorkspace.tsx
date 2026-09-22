// DataWatch — Dataset Workspace (/datasets/:id) with 7 tabs
// This is the most complex page. Tab 5 (Drift) is REAL with API integration.
import { useState, useRef, useEffect } from "react";
import { useParams, useSearchParams, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, CheckCircle, XCircle, AlertTriangle, ChevronDown, Activity } from "lucide-react";
import { useDriftStore } from "../store/driftStore";
import { analyzeDrift } from "../api/drift";
import { MOCK_DATASETS, MOCK_EXPECTATIONS, MOCK_COLUMN_PROFILES, MOCK_RUN_HISTORY } from "../data/mockData";
import { StatusBadge } from "../components/ui/StatusBadge";
import { DriftSummary } from "../components/drift/DriftSummary";
import { DriftTable } from "../components/drift/DriftTable";
import { FeatureDrawer } from "../components/drift/FeatureDrawer";
import type { FeatureDriftResult } from "../types/drift";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "quality", label: "Quality" },
  { id: "schema", label: "Schema" },
  { id: "drift", label: "Drift", highlight: true },
  { id: "model", label: "Model Impact" },
  { id: "runs", label: "Runs" },
];

// ─── Sub-Tab: Overview ───────────────────────────────────────────────────────
function OverviewTab({ dataset }: { dataset: ReturnType<typeof MOCK_DATASETS["find"]> }) {
  if (!dataset) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
      <div className="lg:col-span-2 flex flex-col gap-space-md">
        {/* Summary card */}
        <div className="card p-space-md">
          <h3 className="font-space text-headline-sm text-on-surface mb-space-md">Dataset Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
            {[
              { label: "Total Rows", value: dataset.rowsFormatted },
              { label: "Features", value: dataset.features.toString() },
              { label: "Quality Score", value: dataset.qualityScore ? `${dataset.qualityScore}%` : "—" },
              { label: "Latest Run", value: dataset.latestRun ?? "—" },
              { label: "Environment", value: dataset.environment },
              { label: "Cadence", value: dataset.cadence },
              { label: "Source", value: dataset.sourceType },
              { label: "Status", value: dataset.status },
            ].map(({ label, value }) => (
              <div key={label} className="trough p-space-sm">
                <p className="font-mono text-tech-sm text-on-surface-variant mb-space-2xs">{label}</p>
                <p className="font-mono text-tech-val text-on-surface font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Tags */}
        <div className="card p-space-md">
          <h3 className="font-space text-headline-sm text-on-surface mb-space-sm">Tags</h3>
          <div className="flex flex-wrap gap-space-xs">
            {dataset.tags.map(t => <span key={t} className="badge-info px-space-sm py-space-xs">{t}</span>)}
          </div>
        </div>
        {/* Pipeline lineage */}
        <div className="card p-space-md">
          <h3 className="font-space text-headline-sm text-on-surface mb-space-md">Pipeline Lineage</h3>
          <div className="flex items-center gap-0 overflow-x-auto pb-space-xs">
            {["S3 Source", "Ingest", "Profile", "GX Valid", "Schema Diff", "Drift Engine", "ML Eval"].map((stage, i) => (
              <div key={i} className="flex items-center flex-shrink-0">
                <div className={`px-space-sm py-space-xs rounded-lg text-center ${
                  stage === "Drift Engine" ? "bg-error-container/60 border border-error/30" :
                  stage === "GX Valid" ? "bg-amber-50 border border-amber-400/30" :
                  "bg-surface-container-highest"
                }`}>
                  <div className="font-mono text-tech-sm text-on-surface whitespace-nowrap">{stage}</div>
                </div>
                {i < 6 && <div className="w-6 h-px bg-outline-variant flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-space-md">
        <div className="card p-space-md">
          <h3 className="font-space text-headline-sm text-on-surface mb-space-md">Active Consumers</h3>
          {["Churn Classifier v2.1", "Revenue Attribution Model", "Customer Segmentation"].map((c) => (
            <div key={c} className="flex items-center gap-space-sm py-space-xs border-b border-outline-variant/20 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <span className="font-inter text-body-sm text-on-surface">{c}</span>
            </div>
          ))}
        </div>
        <div className="card p-space-md">
          <h3 className="font-space text-headline-sm text-on-surface mb-space-md">Description</h3>
          <p className="font-inter text-body-sm text-on-surface-variant">{dataset.description}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Tab: Profile ────────────────────────────────────────────────────────
function ProfileTab() {
  return (
    <div className="card overflow-hidden">
      <div className="p-space-md border-b border-outline-variant/20 flex justify-between items-center">
        <h3 className="font-space text-headline-sm text-on-surface">Column Profiles</h3>
        <span className="font-mono text-tech-sm text-on-surface-variant">{MOCK_COLUMN_PROFILES.length} columns</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Column</th><th>Type</th><th>Missing %</th><th>Unique %</th>
            <th>Mean / Top Value</th><th>Std Dev / Count</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_COLUMN_PROFILES.map(col => (
            <tr key={col.name}>
              <td><span className="font-mono text-tech-val font-semibold text-on-surface">{col.name}</span></td>
              <td><span className="badge-info uppercase">{col.type}</span></td>
              <td>
                <span className={`font-mono text-tech-val ${col.missingPct > 2 ? "text-secondary font-bold" : "text-on-surface"}`}>
                  {col.missingPct.toFixed(2)}%
                </span>
              </td>
              <td><span className="font-mono text-tech-val text-on-surface">{col.uniquePct.toFixed(2)}%</span></td>
              <td>
                <span className="font-mono text-tech-sm text-on-surface-variant">
                  {col.type === "numeric" && col.mean !== undefined
                    ? col.mean.toFixed(2)
                    : col.topCategories?.[0]?.value ?? "—"}
                </span>
              </td>
              <td>
                <span className="font-mono text-tech-sm text-on-surface-variant">
                  {col.type === "numeric" && col.std !== undefined
                    ? `σ ${col.std.toFixed(2)}`
                    : col.topCategories ? `${col.topCategories.length} cats` : "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-Tab: Quality (GX) ───────────────────────────────────────────────────
function QualityTab() {
  const passed = MOCK_EXPECTATIONS.filter(e => e.status === "passed").length;
  const failed = MOCK_EXPECTATIONS.filter(e => e.status === "failed").length;
  const warning = MOCK_EXPECTATIONS.filter(e => e.status === "warning").length;
  const skipped = MOCK_EXPECTATIONS.filter(e => e.status === "skipped").length;
  const passRate = Math.round(passed / (MOCK_EXPECTATIONS.length - skipped) * 100);

  return (
    <div className="flex flex-col gap-space-md">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-space-sm">
        {[
          { label: "Pass Rate", value: `${passRate}%`, variant: "success" },
          { label: "Passed", value: passed, variant: "success" },
          { label: "Failed", value: failed, variant: "critical" },
          { label: "Warning", value: warning, variant: "warning" },
        ].map(({ label, value, variant }) => (
          <div key={label} className={`card-raised p-space-sm text-center border ${
            variant === "critical" ? "border-error/25" : variant === "warning" ? "border-secondary/25" : "border-tertiary/25"
          }`}>
            <div className={`font-mono text-tech-display leading-none ${
              variant === "critical" ? "text-error" : variant === "warning" ? "text-secondary" : "text-tertiary"
            }`}>{value}</div>
            <div className="font-mono text-label-sm text-on-surface-variant mt-space-2xs uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Expectations table */}
      <div className="card overflow-hidden">
        <div className="p-space-md border-b border-outline-variant/20">
          <h3 className="font-space text-headline-sm text-on-surface">Expectation Suite: churn_v2_strict</h3>
          <p className="font-mono text-tech-sm text-on-surface-variant">Run #1042 · Suite version 2.3.1</p>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Expectation</th><th>Column</th><th>Status</th><th>Observed</th><th>Expected</th></tr>
          </thead>
          <tbody>
            {MOCK_EXPECTATIONS.map(exp => (
              <tr key={exp.id}>
                <td><span className="font-mono text-tech-sm text-on-surface">{exp.expectation}</span></td>
                <td><span className="font-mono text-tech-sm text-on-surface-variant">{exp.column ?? "table"}</span></td>
                <td>
                  {exp.status === "passed" ? <CheckCircle size={16} className="text-tertiary" /> :
                   exp.status === "failed" ? <XCircle size={16} className="text-error" /> :
                   exp.status === "warning" ? <AlertTriangle size={16} className="text-secondary" /> :
                   <span className="font-mono text-tech-sm text-on-surface-variant">SKIP</span>}
                </td>
                <td>
                  <span className={`font-mono text-tech-sm ${exp.status === "failed" ? "text-error font-bold" : exp.status === "warning" ? "text-secondary font-semibold" : "text-on-surface-variant"}`}>
                    {exp.observed ?? "—"}
                  </span>
                </td>
                <td><span className="font-mono text-tech-sm text-on-surface-variant">{exp.expected ?? "—"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sub-Tab: Schema ─────────────────────────────────────────────────────────
const SCHEMA_DIFF = [
  { col: "customerID", type: "VARCHAR(50)", status: "unchanged" },
  { col: "gender", type: "VARCHAR(10)", status: "unchanged" },
  { col: "SeniorCitizen", type: "INT64", status: "unchanged" },
  { col: "MonthlyCharges", type: "FLOAT64", status: "unchanged" },
  { col: "TotalCharges", type: "FLOAT64", status: "unchanged" },
  { col: "Churn", type: "VARCHAR(5)", status: "unchanged" },
  { col: "churn_probability_score", type: "FLOAT64", status: "added" },
];

function SchemaTab() {
  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex items-center gap-space-sm p-space-md bg-secondary-fixed/15 rounded-xl border border-secondary/25">
        <AlertTriangle size={18} className="text-secondary" />
        <div>
          <p className="font-inter text-body-sm text-on-surface font-semibold">Additive schema mutation detected</p>
          <p className="font-mono text-tech-sm text-on-surface-variant">New column churn_probability_score (FLOAT64) in batch #1042 not present in frozen schema v1.4</p>
        </div>
        <span className="badge-high ml-auto">HIGH</span>
      </div>
      <div className="card overflow-hidden">
        <div className="p-space-md border-b border-outline-variant/20 flex justify-between">
          <h3 className="font-space text-headline-sm text-on-surface">Schema Diff v1.4 → v1.5</h3>
          <div className="flex gap-space-xs">
            <span className="badge-critical">1 Added</span>
            <span className="badge-stable">6 Unchanged</span>
          </div>
        </div>
        <table className="data-table">
          <thead><tr><th>Column</th><th>Data Type</th><th>Status</th></tr></thead>
          <tbody>
            {SCHEMA_DIFF.map(row => (
              <tr key={row.col} className={row.status === "added" ? "bg-secondary-fixed/10" : ""}>
                <td>
                  <span className="font-mono text-tech-val font-semibold text-on-surface">
                    {row.status === "added" ? "+ " : "  "}{row.col}
                  </span>
                </td>
                <td><span className="font-mono text-tech-sm text-on-surface-variant">{row.type}</span></td>
                <td>
                  {row.status === "added"
                    ? <span className="badge-high">ADDED</span>
                    : <span className="badge-stable">UNCHANGED</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sub-Tab: Drift (REAL API INTEGRATION) ───────────────────────────────────
function DriftTab() {
  const { result, isAnalyzing, error, setResult, setAnalyzing, setError } = useDriftStore();
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [psiThreshold, setPsiThreshold] = useState<number>(0.25);
  const [selectedFeature, setSelectedFeature] = useState<FeatureDriftResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);
  const curInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!referenceFile || !currentFile) {
      setError("Please select both reference and current CSV files.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeDrift({
        referenceFile,
        currentFile,
        psiThreshold,
        datasetName: "Telco Customer Churn",
      });
      setResult(result);
    } catch (e: any) {
      setError(e.message || "Analysis failed. Check that the backend is running.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRowClick = (feature: FeatureDriftResult) => {
    setSelectedFeature(feature);
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Upload panel */}
      <div className="card-raised p-space-md">
        <div className="flex items-center justify-between mb-space-md">
          <div>
            <h3 className="font-space text-headline-sm text-on-surface">Statistical Drift Analysis</h3>
            <p className="font-inter text-body-sm text-on-surface-variant">
              Upload reference baseline and current batch CSV files to run PSI, KS, Wasserstein, and JS divergence analysis.
            </p>
          </div>
          <span className="badge-info">REAL · FastAPI Backend</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-md">
          {/* Reference file */}
          <div>
            <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">
              Reference Dataset (Baseline)
            </label>
            <div
              className={`trough p-space-md rounded-xl flex flex-col items-center justify-center gap-space-sm cursor-pointer hover:bg-surface-container-high transition-colors ${referenceFile ? "border-2 border-tertiary/40" : "border-2 border-dashed border-outline-variant/40"}`}
              onClick={() => refInputRef.current?.click()}
            >
              <Upload size={24} className={referenceFile ? "text-tertiary" : "text-outline"} />
              <div className="text-center">
                {referenceFile ? (
                  <>
                    <p className="font-mono text-tech-val text-tertiary font-semibold">{referenceFile.name}</p>
                    <p className="font-mono text-tech-sm text-on-surface-variant">{(referenceFile.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-tech-val text-on-surface">reference_data.csv</p>
                    <p className="font-mono text-tech-sm text-on-surface-variant">Click to select · CSV only</p>
                  </>
                )}
              </div>
              <input
                ref={refInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => setReferenceFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {/* Current file */}
          <div>
            <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">
              Current Batch (to Analyze)
            </label>
            <div
              className={`trough p-space-md rounded-xl flex flex-col items-center justify-center gap-space-sm cursor-pointer hover:bg-surface-container-high transition-colors ${currentFile ? "border-2 border-primary-container/50" : "border-2 border-dashed border-outline-variant/40"}`}
              onClick={() => curInputRef.current?.click()}
            >
              <Upload size={24} className={currentFile ? "text-primary-container" : "text-outline"} />
              <div className="text-center">
                {currentFile ? (
                  <>
                    <p className="font-mono text-tech-val text-primary font-semibold">{currentFile.name}</p>
                    <p className="font-mono text-tech-sm text-on-surface-variant">{(currentFile.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-tech-val text-on-surface">current_data.csv</p>
                    <p className="font-mono text-tech-sm text-on-surface-variant">Click to select · CSV only</p>
                  </>
                )}
              </div>
              <input
                ref={curInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => setCurrentFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        </div>

        {/* PSI threshold + action */}
        <div className="flex items-center gap-space-md flex-wrap">
          <div className="flex items-center gap-space-sm">
            <label className="font-mono text-label-sm text-on-surface-variant">PSI Threshold</label>
            <div className="flex items-center gap-space-xs bg-surface-container-highest rounded-xl px-space-sm py-space-xs">
              <button
                onClick={() => setPsiThreshold(t => Math.max(0.05, parseFloat((t - 0.05).toFixed(2))))}
                className="text-on-surface-variant hover:text-on-surface font-mono font-bold"
              >−</button>
              <span className="font-mono text-tech-val text-on-surface w-12 text-center">{psiThreshold.toFixed(2)}</span>
              <button
                onClick={() => setPsiThreshold(t => Math.min(0.50, parseFloat((t + 0.05).toFixed(2))))}
                className="text-on-surface-variant hover:text-on-surface font-mono font-bold"
              >+</button>
            </div>
          </div>

          <button
            id="analyze-drift-btn"
            onClick={handleAnalyze}
            disabled={!referenceFile || !currentFile || isAnalyzing}
            className={`btn-primary px-space-lg py-space-sm gap-space-xs ${
              (!referenceFile || !currentFile || isAnalyzing) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Activity size={16} />
                Analyze Drift
              </>
            )}
          </button>

          <p className="font-mono text-tech-sm text-on-surface-variant">
            Algorithms: PSI · KS Test · Wasserstein · Jensen-Shannon
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-space-md p-space-sm bg-error-container/30 border border-error/25 rounded-xl flex items-center gap-space-sm">
            <XCircle size={16} className="text-error flex-shrink-0" />
            <p className="font-mono text-tech-sm text-error">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <motion.div
          className="flex flex-col gap-space-md"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <DriftSummary />
          <DriftTable features={result.features} onRowClick={handleRowClick} psiThreshold={result.psi_threshold} />
        </motion.div>
      )}

      {!result && !isAnalyzing && (
        <div className="text-center py-space-2xl card">
          <Activity size={32} className="text-outline mx-auto mb-space-md" />
          <h3 className="font-space text-headline-sm text-on-surface mb-space-sm">No Analysis Yet</h3>
          <p className="font-inter text-body-md text-on-surface-variant max-w-md mx-auto">
            Upload reference and current CSV files above, then click "Analyze Drift" to run the drift detection engine.
          </p>
          <p className="font-mono text-tech-sm text-on-surface-variant mt-space-sm">
            Demo files: <code>backend/data/reference_data.csv</code> and <code>backend/data/current_data.csv</code>
          </p>
        </div>
      )}

      <FeatureDrawer
        feature={selectedFeature}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        psiThreshold={result?.psi_threshold ?? psiThreshold}
      />
    </div>
  );
}

// ─── Sub-Tab: Model Impact ────────────────────────────────────────────────────
function ModelImpactTab() {
  return (
    <div className="flex flex-col gap-space-md">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
        {[
          { label: "F1-Score", value: "79.0%", ref: "83.0%", delta: "−4.0pp", variant: "secondary" },
          { label: "Precision", value: "76.4%", ref: "80.2%", delta: "−3.8pp", variant: "secondary" },
          { label: "Recall", value: "81.7%", ref: "85.9%", delta: "−4.2pp", variant: "secondary" },
          { label: "AUC-ROC", value: "0.812", ref: "0.851", delta: "−0.039", variant: "secondary" },
        ].map(({ label, value, ref, delta, variant }) => (
          <div key={label} className="card-raised p-space-md">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mb-space-xs">{label}</p>
            <p className="font-mono text-tech-display text-secondary">{value}</p>
            <p className="font-mono text-tech-sm text-on-surface-variant">Baseline: {ref}</p>
            <p className="font-mono text-tech-sm text-secondary font-semibold">{delta} from baseline</p>
          </div>
        ))}
      </div>
      <div className="card p-space-md">
        <h3 className="font-space text-headline-sm text-on-surface mb-space-sm">Analysis</h3>
        <p className="font-inter text-body-md text-on-surface-variant">
          Model performance degradation observed correlates with the MonthlyCharges distribution shift (+41%). 
          The Churn Classifier was trained on reference data where MonthlyCharges mean was $64.70.
          Current batch mean of $91.20 falls outside the training distribution, causing feature importance 
          misalignment. Recommend re-training or recalibration.
        </p>
      </div>
    </div>
  );
}

// ─── Sub-Tab: Runs ────────────────────────────────────────────────────────────
function RunsTab() {
  return (
    <div className="card overflow-hidden">
      <div className="p-space-md border-b border-outline-variant/20">
        <h3 className="font-space text-headline-sm text-on-surface">Run History</h3>
      </div>
      <table className="data-table">
        <thead><tr><th>Run ID</th><th>Timestamp</th><th>Status</th><th>Rows</th><th>Quality</th><th>Max PSI</th><th>Duration</th><th>Trigger</th></tr></thead>
        <tbody>
          {MOCK_RUN_HISTORY.map(run => (
            <tr key={run.runId}>
              <td><span className="font-mono text-tech-val font-semibold text-primary">{run.runId}</span></td>
              <td><span className="font-mono text-tech-sm text-on-surface-variant">{new Date(run.timestamp).toLocaleString()}</span></td>
              <td>
                {run.status === "passed" ? <CheckCircle size={16} className="text-tertiary" /> :
                 run.status === "failed" ? <XCircle size={16} className="text-error" /> :
                 <AlertTriangle size={16} className="text-secondary" />}
              </td>
              <td><span className="font-mono text-tech-val">{run.rows.toLocaleString()}</span></td>
              <td><span className={`font-mono text-tech-val font-semibold ${run.qualityScore < 95 ? "text-secondary" : "text-tertiary"}`}>{run.qualityScore.toFixed(1)}%</span></td>
              <td><span className={`font-mono text-tech-val font-semibold ${run.maxPsi >= 0.25 ? "text-error" : "text-on-surface"}`}>{run.maxPsi.toFixed(3)}</span></td>
              <td><span className="font-mono text-tech-sm text-on-surface-variant">{run.duration}</span></td>
              <td><span className="badge-info uppercase text-xs">{run.triggerType}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main DatasetWorkspace Page ───────────────────────────────────────────────
export default function DatasetWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const dataset = MOCK_DATASETS.find(ds => ds.id === id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams(tabId !== "overview" ? { tab: tabId } : {});
  };

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-space-md">
        <h2 className="font-space text-headline-md text-on-surface">Dataset not found</h2>
        <NavLink to="/datasets" className="btn-primary gap-space-xs">
          <ArrowLeft size={16} /> Back to Catalog
        </NavLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Workspace Header */}
      <div className="px-space-lg pt-space-lg pb-space-md border-b border-outline-variant/25 bg-surface-container-low sticky top-16 z-30">
        <div className="flex items-start gap-space-md flex-wrap">
          <NavLink to="/datasets" className="btn-ghost p-space-xs rounded-xl mt-1">
            <ArrowLeft size={18} />
          </NavLink>
          <div className="flex-1">
            <div className="flex items-center gap-space-sm flex-wrap mb-space-xs">
              <h1 className="font-space text-headline-md text-on-surface">{dataset.name}</h1>
              <StatusBadge status={dataset.status} size="md" />
              <span className="badge-info">{dataset.environment}</span>
            </div>
            <div className="flex items-center gap-space-md flex-wrap">
              <span className="font-mono text-tech-sm text-on-surface-variant">{dataset.id}</span>
              <span className="font-mono text-tech-sm text-on-surface-variant">·</span>
              <span className="font-mono text-tech-sm text-on-surface-variant">{dataset.rowsFormatted} rows</span>
              <span className="font-mono text-tech-sm text-on-surface-variant">·</span>
              <span className="font-mono text-tech-sm text-on-surface-variant">{dataset.features} features</span>
              <span className="font-mono text-tech-sm text-on-surface-variant">·</span>
              <span className="font-mono text-tech-sm text-on-surface-variant">{dataset.cadence}</span>
            </div>
          </div>
          {dataset.maxDriftPsi !== undefined && (
            <div className="text-right">
              <div className={`font-mono text-tech-display leading-none ${dataset.maxDriftPsi >= 0.25 ? "text-error" : "text-on-surface"}`}>
                {dataset.maxDriftPsi.toFixed(3)}
              </div>
              <div className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">Max PSI</div>
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="tab-strip mt-space-md -mb-px">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={`tab-item ${activeTab === tab.id ? "active" : ""} ${tab.highlight ? "font-semibold" : ""}`}
            >
              {tab.label}
              {tab.highlight && tab.id === "drift" && (
                <span className="ml-space-xs badge-critical inline-block text-xs py-0 px-space-xs">LIVE</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-space-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "overview" && <OverviewTab dataset={dataset} />}
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "quality" && <QualityTab />}
            {activeTab === "schema" && <SchemaTab />}
            {activeTab === "drift" && <DriftTab />}
            {activeTab === "model" && <ModelImpactTab />}
            {activeTab === "runs" && <RunsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
