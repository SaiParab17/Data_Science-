// DataWatch — Reusable Status Badge Component
import type { DriftSeverity } from "../../types/drift";
import type { AlertSeverity } from "../../types/dataset";

type BadgeVariant = DriftSeverity | AlertSeverity | "Stable" | "Moderate" | "High" | "Critical" | "Warning" | "Resolved" | "Running" | "Paused" | "Healthy" | "Attention Required" | "STABLE" | "WARNING" | "DRIFT" | "NO_DRIFT" | "DRIFT_DETECTED" | "Failed" | "FAILED" | "Degraded" | "DEGRADED";

interface StatusBadgeProps {
  status: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const BADGE_STYLES: Record<string, string> = {
  Critical: "badge-critical",
  CRITICAL: "badge-critical",
  High: "badge-high",
  HIGH: "badge-high",
  Warning: "badge-warning",
  WARNING: "badge-warning",
  "Attention Required": "badge-high",
  Moderate: "badge-warning",
  MODERATE: "badge-warning",
  Stable: "badge-stable",
  STABLE: "badge-stable",
  Healthy: "badge-stable",
  HEALTHY: "badge-stable",
  NO_DRIFT: "badge-stable",
  Resolved: "badge-stable",
  RESOLVED: "badge-stable",
  Running: "badge-info",
  RUNNING: "badge-info",
  DRIFT: "badge-critical",
  DRIFT_DETECTED: "badge-critical",
  WARNING_DETECTED: "badge-warning",
  Failed: "badge-critical",
  FAILED: "badge-critical",
  Degraded: "badge-warning",
  DEGRADED: "badge-warning",
  Paused: "px-space-xs py-space-2xs rounded font-mono text-tech-sm font-bold bg-surface-container-highest text-on-surface-variant border border-outline-variant/40",
};

const BADGE_LABELS: Record<string, string> = {
  DRIFT: "DRIFT",
  DRIFT_DETECTED: "DRIFT DETECTED",
  NO_DRIFT: "STABLE",
  WARNING: "WARNING",
  "Attention Required": "ATTENTION",
};

export function StatusBadge({ status, size = "sm", className = "" }: StatusBadgeProps) {
  const styleClass = BADGE_STYLES[status] ?? "badge-info";
  const label = BADGE_LABELS[status] ?? status;
  const sizeClass = size === "md" ? "text-label-sm px-space-sm py-space-xs" : "";

  return (
    <span className={`${styleClass} ${sizeClass} ${className} uppercase tracking-wider`}>
      {label}
    </span>
  );
}
