// DataWatch — Drift Table (feature list sorted by PSI)
import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";
import type { FeatureDriftResult } from "../../types/drift";

type SortField = "column_name" | "psi" | "status" | "data_type";
type SortDir = "asc" | "desc";

interface DriftTableProps {
  features: FeatureDriftResult[];
  onRowClick: (feature: FeatureDriftResult) => void;
  psiThreshold?: number;
}

function PSIBar({ value, threshold = 0.25 }: { value: number; threshold?: number }) {
  const pct = Math.min(value / 0.5 * 100, 100);
  const color =
    value >= threshold
      ? "#9f4028"
      : value >= 0.10
      ? "#c38a36"
      : "#145538";

  return (
    <div className="flex items-center gap-space-sm">
      <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: "width 0.4s ease" }} />
      </div>
      <span className="font-mono text-tech-val font-semibold w-14 text-right" style={{ color }}>
        {value.toFixed(4)}
      </span>
    </div>
  );
}

export function DriftTable({ features, onRowClick, psiThreshold = 0.25 }: DriftTableProps) {
  const [sortField, setSortField] = useState<SortField>("psi");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<"all" | "drift" | "warning" | "stable">("all");

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = features.filter((f) => {
    if (filter === "all") return true;
    if (filter === "drift") return f.status === "DRIFT";
    if (filter === "warning") return f.status === "WARNING";
    return f.status === "STABLE";
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const driftCount = features.filter(f => f.status === "DRIFT").length;
  const warningCount = features.filter(f => f.status === "WARNING").length;
  const stableCount = features.filter(f => f.status === "STABLE").length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown size={12} className="text-outline/50" />;
    return sortDir === "asc"
      ? <ChevronUp size={12} className="text-primary" />
      : <ChevronDown size={12} className="text-primary" />;
  };

  return (
    <div className="flex flex-col gap-space-md">
      {/* Filter tabs */}
      <div className="flex items-center gap-space-xs flex-wrap">
        {[
          { key: "all", label: `All (${features.length})` },
          { key: "drift", label: `Drift (${driftCount})` },
          { key: "warning", label: `Warning (${warningCount})` },
          { key: "stable", label: `Stable (${stableCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`px-space-md py-space-xs rounded-xl font-mono text-tech-sm transition-all ${
              filter === key
                ? "bg-primary-container text-on-primary shadow-primary-glow"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
        <table className="data-table">
          <thead>
            <tr>
              {[
                { label: "Feature", field: "column_name" as SortField },
                { label: "Type", field: "data_type" as SortField },
                { label: "Status", field: "status" as SortField },
                { label: "PSI Score", field: "psi" as SortField },
                { label: "KS Stat", field: null },
                { label: "Wasserstein", field: null },
                { label: "JS Div", field: null },
                { label: "Missing Δ", field: null },
              ].map(({ label, field }) => (
                <th
                  key={label}
                  onClick={field ? () => handleSort(field) : undefined}
                  className={field ? "cursor-pointer select-none hover:bg-surface-container-highest" : ""}
                >
                  <div className="flex items-center gap-space-xs">
                    {label}
                    {field && <SortIcon field={field} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-space-xl text-on-surface-variant font-mono text-tech-sm">
                  No features match the selected filter.
                </td>
              </tr>
            )}
            {sorted.map((feature) => {
              const missingDelta = feature.current_missing_pct - feature.reference_missing_pct;
              return (
                <tr
                  key={feature.column_name}
                  onClick={() => onRowClick(feature)}
                  className="cursor-pointer"
                >
                  <td>
                    <span className="font-mono text-tech-val text-on-surface font-semibold">
                      {feature.column_name}
                    </span>
                  </td>
                  <td>
                    <span className="badge-info uppercase tracking-wide text-xs">
                      {feature.data_type}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={feature.severity} />
                  </td>
                  <td className="min-w-[160px]">
                    <PSIBar value={feature.psi} threshold={psiThreshold} />
                  </td>
                  <td>
                    <span className="font-mono text-tech-sm text-on-surface-variant">
                      {feature.ks_statistic !== undefined
                        ? `${feature.ks_statistic.toFixed(4)} (p=${feature.ks_p_value?.toFixed(3)})`
                        : "—"}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-tech-sm text-on-surface-variant">
                      {feature.wasserstein_distance !== undefined
                        ? feature.wasserstein_distance.toFixed(4)
                        : "—"}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-tech-sm text-on-surface-variant">
                      {feature.js_divergence !== undefined
                        ? feature.js_divergence.toFixed(4)
                        : "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`font-mono text-tech-sm font-semibold ${
                      missingDelta > 2 ? "text-secondary" : missingDelta > 0.5 ? "text-yellow-600" : "text-on-surface-variant"
                    }`}>
                      {missingDelta > 0 ? "+" : ""}{missingDelta.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
