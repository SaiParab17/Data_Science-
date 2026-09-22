// DataWatch — Drift Summary Cards (shown at top of Drift tab after analysis)
import { useDriftStore } from "../../store/driftStore";
import { StatusBadge } from "../ui/StatusBadge";
import { CheckCircle, AlertTriangle, XCircle, BarChart2, TrendingUp, Database } from "lucide-react";

export function DriftSummary() {
  const { result } = useDriftStore();

  if (!result) return null;

  const statusIcon =
    result.overall_status === "DRIFT_DETECTED" ? (
      <XCircle size={22} className="text-error" />
    ) : result.overall_status === "WARNING" ? (
      <AlertTriangle size={22} className="text-secondary" />
    ) : (
      <CheckCircle size={22} className="text-tertiary" />
    );

  const statusLabel =
    result.overall_status === "DRIFT_DETECTED"
      ? "Drift Detected"
      : result.overall_status === "WARNING"
      ? "Warning"
      : "No Drift";

  return (
    <div className="flex flex-col gap-space-md">
      {/* Overall status banner */}
      <div
        className={`p-space-md rounded-xl border flex items-start gap-space-md ${
          result.overall_status === "DRIFT_DETECTED"
            ? "bg-secondary-fixed/15 border-secondary/30"
            : result.overall_status === "WARNING"
            ? "bg-amber-50/60 border-amber-400/30"
            : "bg-tertiary-fixed/15 border-tertiary/30"
        }`}
      >
        {statusIcon}
        <div className="flex-1">
          <div className="flex items-center gap-space-sm mb-space-2xs">
            <h3 className="font-space text-headline-sm text-on-surface">{statusLabel}</h3>
            <StatusBadge status={result.overall_status} />
          </div>
          <p className="font-inter text-body-sm text-on-surface-variant">
            Analysis of <strong>{result.dataset_name}</strong> — Reference:{" "}
            {result.reference_rows.toLocaleString()} rows · Current:{" "}
            {result.current_rows.toLocaleString()} rows · {result.analyzed_columns} features analyzed
            · Timestamp: {new Date(result.analysis_timestamp).toLocaleString()}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-mono text-tech-display text-on-surface leading-none">
            {result.max_psi.toFixed(3)}
          </div>
          <div className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mt-space-2xs">
            Max PSI
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-space-sm">
        {[
          {
            label: "Drifted",
            value: result.drifted_columns,
            icon: <XCircle size={16} />,
            color: "text-error",
            bg: result.drifted_columns > 0 ? "border-error/25 bg-error-container/20" : "",
          },
          {
            label: "Warning",
            value: result.warning_columns,
            icon: <AlertTriangle size={16} />,
            color: "text-secondary",
            bg: result.warning_columns > 0 ? "border-secondary/25 bg-secondary-fixed/15" : "",
          },
          {
            label: "Stable",
            value: result.stable_columns,
            icon: <CheckCircle size={16} />,
            color: "text-tertiary",
            bg: "",
          },
          {
            label: "Max PSI",
            value: result.max_psi.toFixed(3),
            icon: <BarChart2 size={16} />,
            color: result.max_psi >= result.psi_threshold ? "text-error" : "text-on-surface",
            bg: result.max_psi >= result.psi_threshold ? "border-error/25 bg-error-container/20" : "",
          },
          {
            label: "Ref. Rows",
            value: result.reference_rows.toLocaleString(),
            icon: <Database size={16} />,
            color: "text-on-surface",
            bg: "",
          },
          {
            label: "Cur. Rows",
            value: result.current_rows.toLocaleString(),
            icon: <TrendingUp size={16} />,
            color: "text-on-surface",
            bg: "",
          },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className={`card-raised p-space-sm text-center border ${bg || "border-outline-variant/20"}`}>
            <div className={`flex items-center justify-center mb-space-xs ${color}`}>{icon}</div>
            <div className={`font-mono text-tech-display leading-none ${color}`}>{value}</div>
            <div className="font-mono text-label-sm text-on-surface-variant mt-space-2xs uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
