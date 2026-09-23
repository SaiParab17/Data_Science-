// DataWatch — Data Quality Overview Component
// Renders real Great Expectations validation results, 4-dimension scores,
// quality status, score deductions, and interactive failure breakdown.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Database,
  Info,
  Clock,
  ExternalLink,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { DataQualityResult, QualityCheckResult, QualityDimension } from "../../types/quality";

interface QualityOverviewCardProps {
  quality: DataQualityResult | null;
  isLoading?: boolean;
  error?: string | null;
  showDetailsButton?: boolean;
}

const DIMENSION_CONFIG: Record<
  QualityDimension,
  { label: string; desc: string; icon: string; color: string }
> = {
  completeness: {
    label: "Completeness",
    desc: "Missing & null values",
    icon: "💧",
    color: "#063cbc",
  },
  uniqueness: {
    label: "Uniqueness",
    desc: "Duplicates & primary keys",
    icon: "💎",
    color: "#2e6930",
  },
  validity: {
    label: "Validity",
    desc: "Ranges, types & allowed sets",
    icon: "🎯",
    color: "#9f4028",
  },
  schema_compliance: {
    label: "Schema Compliance",
    desc: "Column presence & data types",
    icon: "📐",
    color: "#747685",
  },
};

export function QualityOverviewCard({
  quality,
  isLoading = false,
  error = null,
  showDetailsButton = true,
}: QualityOverviewCardProps) {
  const [showFailedOnly, setShowFailedOnly] = useState(true);
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  // ─── 1. Loading State ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="card-raised p-space-lg flex flex-col items-center justify-center min-h-64 text-center">
        <div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin mb-space-md" />
        <h3 className="font-space text-headline-sm text-on-surface mb-space-xs">
          Running Great Expectations Quality Suite
        </h3>
        <p className="font-mono text-tech-sm text-on-surface-variant max-w-md">
          Validating completeness, schema compliance, uniqueness, and value validity across datasets...
        </p>
      </div>
    );
  }

  // ─── 2. Error State ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="card-raised p-space-lg border border-error/30 bg-error-container/20">
        <div className="flex items-start gap-space-md">
          <XCircle size={24} className="text-error flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-space text-headline-sm text-on-surface mb-space-xs">
              Quality Validation Error
            </h3>
            <p className="font-mono text-tech-sm text-error">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── 3. Empty State ──────────────────────────────────────────────────────────
  if (!quality) {
    return (
      <div className="card-raised p-space-lg text-center flex flex-col items-center justify-center py-space-xl">
        <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-2xl mb-space-md">
          🛡️
        </div>
        <h3 className="font-space text-headline-sm text-on-surface mb-space-xs">
          No Quality Validation Computed
        </h3>
        <p className="font-inter text-body-sm text-on-surface-variant max-w-lg mb-space-md">
          Run dataset analysis with Great Expectations enabled to calculate completeness,
          validity, uniqueness, and schema-compliance scores.
        </p>
        <NavLink
          to="/datasets/DS-TELCO-001?tab=drift"
          className="btn-primary gap-space-xs text-sm py-space-xs px-space-md"
        >
          <Database size={16} />
          Go to Dataset Workspace
        </NavLink>
      </div>
    );
  }

  // ─── 4. Populated State ──────────────────────────────────────────────────────
  const {
    overall_score,
    status,
    dimensions,
    passed_checks,
    failed_checks,
    total_checks,
    checks,
    major_deductions,
    dataset_name,
    validation_timestamp,
  } = quality;

  const failedList = checks.filter((c) => c.status !== "PASSED");
  const displayedChecks = showFailedOnly ? failedList : checks;

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-tertiary";
    if (score >= 70) return "text-secondary";
    return "text-error";
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return "bg-tertiary";
    if (score >= 70) return "bg-secondary";
    return "bg-error";
  };

  const getStatusBadge = (st: string) => {
    if (st === "Good") return <span className="badge-stable">GOOD QUALITY</span>;
    if (st === "Needs Attention") return <span className="badge-warning">NEEDS ATTENTION</span>;
    return <span className="badge-critical">POOR QUALITY</span>;
  };

  return (
    <div className="card-raised p-space-lg flex flex-col gap-space-md">
      {/* Top Header */}
      <div className="flex items-start justify-between flex-wrap gap-space-sm border-b border-outline-variant/20 pb-space-md">
        <div>
          <div className="flex items-center gap-space-sm mb-space-2xs flex-wrap">
            <span className="badge-info flex items-center gap-space-2xs font-mono text-label-sm">
              <ShieldCheck size={14} className="text-primary" />
              GREAT EXPECTATIONS 1.x
            </span>
            {getStatusBadge(status)}
            <span className="font-mono text-tech-sm text-on-surface-variant flex items-center gap-space-2xs">
              <Clock size={12} />
              {new Date(validation_timestamp).toLocaleTimeString()} UTC
            </span>
          </div>
          <h2 className="font-space text-headline-sm text-on-surface">
            Data Quality & Integrity Suite — {dataset_name}
          </h2>
          <p className="font-mono text-tech-sm text-on-surface-variant">
            Deterministic quality scoring derived from reference baseline expectation suite
          </p>
        </div>

        {showDetailsButton && (
          <NavLink
            to="/datasets/DS-TELCO-001?tab=quality"
            className="btn-secondary gap-space-xs text-sm py-space-xs px-space-sm"
          >
            <span>View Full Suite</span>
            <ExternalLink size={14} />
          </NavLink>
        )}
      </div>

      {/* Main KPI Row: Overall Score Gauge + Dimension Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-center">
        {/* Overall Score Dial */}
        <div className="lg:col-span-4 trough p-space-md rounded-2xl flex flex-col items-center justify-center text-center">
          <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mb-space-2xs">
            Overall Quality Score
          </p>
          <div className="flex items-baseline justify-center gap-space-2xs my-space-xs">
            <span className={`font-mono text-tech-display font-extrabold ${getScoreColor(overall_score)}`}>
              {overall_score.toFixed(1)}
            </span>
            <span className="font-mono text-tech-val text-on-surface-variant">/ 100</span>
          </div>

          <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden my-space-xs">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getProgressColor(overall_score)}`}
              style={{ width: `${Math.max(4, overall_score)}%` }}
            />
          </div>

          {/* Quick checks counter */}
          <div className="flex items-center gap-space-md mt-space-sm font-mono text-tech-sm">
            <div className="flex items-center gap-space-2xs text-tertiary">
              <CheckCircle2 size={15} />
              <span>{passed_checks} Passed</span>
            </div>
            <div className="flex items-center gap-space-2xs text-error">
              <XCircle size={15} />
              <span>{failed_checks} Failed</span>
            </div>
            <div className="text-on-surface-variant">
              <span>{total_checks} Total</span>
            </div>
          </div>
        </div>

        {/* 4 Dimension Score Bars */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
          {(
            [
              "completeness",
              "validity",
              "schema_compliance",
              "uniqueness",
            ] as QualityDimension[]
          ).map((dimKey) => {
            const dimScore = dimensions[dimKey];
            const cfg = DIMENSION_CONFIG[dimKey];
            if (!dimScore) return null;

            return (
              <div
                key={dimKey}
                className="card p-space-sm flex flex-col justify-between hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-start justify-between mb-space-2xs">
                  <div className="flex items-center gap-space-xs">
                    <span className="text-lg">{cfg.icon}</span>
                    <div>
                      <h4 className="font-space text-tech-val font-semibold text-on-surface">
                        {cfg.label}
                      </h4>
                      <p className="font-mono text-label-sm text-on-surface-variant">{cfg.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono text-tech-val font-bold ${getScoreColor(
                        dimScore.score
                      )}`}
                    >
                      {dimScore.score.toFixed(1)}%
                    </span>
                    <span className="block font-mono text-label-sm text-on-surface-variant">
                      w: {(dimScore.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden my-space-xs">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      dimScore.score
                    )}`}
                    style={{ width: `${Math.max(4, dimScore.score)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between font-mono text-label-sm text-on-surface-variant mt-space-2xs">
                  <span>
                    {dimScore.passed_checks} of {dimScore.total_checks} checks passed
                  </span>
                  {dimScore.failed_checks > 0 ? (
                    <span className="text-error font-semibold">
                      {dimScore.failed_checks} failed
                    </span>
                  ) : (
                    <span className="text-tertiary">All pass</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Score Deductions (Explains why score dropped) */}
      {major_deductions && major_deductions.length > 0 && (
        <div className="bg-secondary-fixed/20 border border-secondary/35 rounded-xl p-space-md">
          <div className="flex items-center gap-space-xs mb-space-xs">
            <AlertTriangle size={16} className="text-secondary" />
            <h4 className="font-space text-tech-val font-semibold text-on-surface">
              Major Score Deductions ({major_deductions.length})
            </h4>
          </div>
          <div className="flex flex-col gap-space-xs">
            {major_deductions.slice(0, 3).map((ded, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-space-sm font-mono text-tech-sm"
              >
                <div className="flex items-center gap-space-xs truncate">
                  <span className="text-secondary font-bold">•</span>
                  <span className="text-on-surface truncate">{ded.reason}</span>
                  {ded.column_name && (
                    <span className="badge-info px-1 py-0 text-xs">
                      {ded.column_name}
                    </span>
                  )}
                </div>
                <span className="text-error font-bold flex-shrink-0">
                  -{ded.points_deducted.toFixed(1)} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Checks Explorer */}
      <div className="card overflow-hidden mt-space-xs">
        <div className="p-space-sm border-b border-outline-variant/20 flex items-center justify-between flex-wrap gap-space-sm bg-surface-container">
          <div className="flex items-center gap-space-sm">
            <h4 className="font-space text-tech-val font-semibold text-on-surface">
              Validation Checks Detail
            </h4>
            <span className="font-mono text-tech-sm text-on-surface-variant">
              ({displayedChecks.length} {showFailedOnly ? "failed" : "total"})
            </span>
          </div>

          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => setShowFailedOnly(true)}
              className={`px-space-sm py-space-2xs rounded-lg font-mono text-label-sm transition-all ${
                showFailedOnly
                  ? "bg-surface-container-low text-on-surface shadow-tactile-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Failed Only ({failedList.length})
            </button>
            <button
              onClick={() => setShowFailedOnly(false)}
              className={`px-space-sm py-space-2xs rounded-lg font-mono text-label-sm transition-all ${
                !showFailedOnly
                  ? "bg-surface-container-low text-on-surface shadow-tactile-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              All Checks ({checks.length})
            </button>
          </div>
        </div>

        {displayedChecks.length === 0 ? (
          <div className="p-space-md text-center font-mono text-tech-sm text-tertiary">
            ✓ No failed checks! All expectations passed successfully.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/15">
            {displayedChecks.map((chk: QualityCheckResult) => {
              const isExpanded = expandedCheckId === chk.check_id;
              const isPassed = chk.status === "PASSED";

              return (
                <div
                  key={chk.check_id}
                  className={`p-space-sm transition-colors cursor-pointer hover:bg-surface-container-high ${
                    !isPassed ? "bg-secondary-fixed/5" : ""
                  }`}
                  onClick={() =>
                    setExpandedCheckId(isExpanded ? null : chk.check_id)
                  }
                >
                  <div className="flex items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-sm min-w-0">
                      {isPassed ? (
                        <CheckCircle2
                          size={16}
                          className="text-tertiary flex-shrink-0"
                        />
                      ) : (
                        <XCircle size={16} className="text-error flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-mono text-tech-sm font-semibold text-on-surface">
                          {chk.check_name}
                        </span>
                        {chk.column_name && (
                          <span className="ml-space-xs font-mono text-tech-sm text-on-surface-variant">
                            on{" "}
                            <span className="font-semibold text-on-surface">
                              {chk.column_name}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-space-sm flex-shrink-0">
                      <span className="badge-info capitalize text-xs">
                        {chk.dimension.replace("_", " ")}
                      </span>
                      <span
                        className={`font-mono text-tech-sm font-bold ${
                          isPassed ? "text-tertiary" : "text-error"
                        }`}
                      >
                        {isPassed ? "PASSED" : `${chk.score.toFixed(0)}%`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-outline" />
                      ) : (
                        <ChevronDown size={16} className="text-outline" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-space-sm pt-space-xs border-t border-outline-variant/15 text-sm"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm font-mono text-tech-sm">
                          <div className="trough p-space-xs rounded-lg">
                            <span className="text-on-surface-variant block text-xs uppercase">
                              Expected Condition
                            </span>
                            <span className="text-on-surface font-semibold">
                              {chk.expected_condition}
                            </span>
                          </div>
                          <div className="trough p-space-xs rounded-lg">
                            <span className="text-on-surface-variant block text-xs uppercase">
                              Observed Value
                            </span>
                            <span
                              className={
                                isPassed
                                  ? "text-on-surface"
                                  : "text-error font-bold"
                              }
                            >
                              {String(chk.observed_value ?? "—")}
                            </span>
                          </div>
                        </div>

                        {chk.failure_message && (
                          <p className="mt-space-xs font-mono text-tech-sm text-error">
                            ⚠️ {chk.failure_message}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
