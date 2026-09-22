// DataWatch — Alerts & Incidents Page (/alerts)
import { useState, ReactNode } from "react";
import { AlertTriangle, XCircle, CheckCircle, ChevronRight, X, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDriftStore } from "../store/driftStore";
import { MOCK_ALERTS } from "../data/mockData";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Drawer } from "../components/ui/Drawer";
import type { Alert } from "../types/dataset";

const SEVERITY_ICON: Record<string, ReactNode> = {
  Critical: <XCircle size={18} className="text-error" />,
  High: <AlertTriangle size={18} className="text-secondary" />,
  Warning: <AlertTriangle size={18} className="text-yellow-600" />,
  Resolved: <CheckCircle size={18} className="text-tertiary" />,
};

export default function Alerts() {
  const { result: driftResult } = useDriftStore();
  const [filter, setFilter] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Merge real API alerts with mock alerts
  const apiAlerts: Alert[] = (driftResult?.alerts ?? []).map(a => ({
    id: a.alert_id,
    type: "drift" as const,
    title: a.title,
    description: a.description,
    severity: a.severity as any,
    dataset: a.dataset_name,
    datasetId: "DS-TELCO-001",
    feature: a.column_name,
    metric: a.metric,
    observedValue: a.observed_value,
    threshold: a.threshold,
    timestamp: new Date().toISOString(),
    runId: a.run_id,
    status: "Open" as const,
    source: "drift" as const,
    isFromApi: true,
  }));

  const allAlerts = [...apiAlerts, ...MOCK_ALERTS];
  const filtered = allAlerts.filter(a => {
    if (filter === "all") return true;
    if (filter === "open") return a.status === "Open" || a.status === "Investigating";
    if (filter === "resolved") return a.status === "Resolved";
    return a.severity === filter;
  });

  const counts = {
    open: allAlerts.filter(a => a.status !== "Resolved").length,
    critical: allAlerts.filter(a => a.severity === "Critical").length,
    high: allAlerts.filter(a => a.severity === "High").length,
    resolved: allAlerts.filter(a => a.status === "Resolved").length,
  };

  return (
    <div className="p-space-lg flex flex-col gap-space-lg">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-space text-headline-md text-on-surface">Alerts & Incidents</h1>
          <p className="font-mono text-tech-sm text-on-surface-variant">
            {counts.open} open · {counts.critical} critical · {counts.resolved} resolved
          </p>
        </div>
        <div className="flex items-center gap-space-xs">
          <Bell size={16} className="text-on-surface-variant" />
          {apiAlerts.length > 0 && (
            <span className="badge-critical">+{apiAlerts.length} from real analysis</span>
          )}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-space-sm">
        {[
          { label: "Open", value: counts.open, color: "text-on-surface" },
          { label: "Critical", value: counts.critical, color: "text-error" },
          { label: "High", value: counts.high, color: "text-secondary" },
          { label: "Resolved", value: counts.resolved, color: "text-tertiary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-raised p-space-sm text-center">
            <div className={`font-mono text-tech-display leading-none ${color}`}>{value}</div>
            <div className="font-mono text-label-sm text-on-surface-variant mt-space-2xs uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-space-xs flex-wrap">
        {[
          { key: "all", label: `All (${allAlerts.length})` },
          { key: "open", label: `Open (${counts.open})` },
          { key: "Critical", label: `Critical (${counts.critical})` },
          { key: "High", label: "High" },
          { key: "Warning", label: "Warning" },
          { key: "resolved", label: `Resolved (${counts.resolved})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-space-md py-space-xs rounded-xl font-mono text-tech-sm transition-all ${
              filter === key
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="flex flex-col gap-space-xs">
        {filtered.map((alert, i) => (
          <motion.div
            key={`${alert.id}-${i}`}
            className={`card p-space-md flex items-start gap-space-md cursor-pointer hover:bg-surface-container-high transition-colors ${
              alert.isFromApi ? "border-l-4 border-primary-container" : ""
            }`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => setSelectedAlert(alert)}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
              alert.severity === "Critical" ? "bg-error-container/60" :
              alert.severity === "High" ? "bg-secondary-fixed/60" :
              alert.severity === "Resolved" ? "bg-tertiary-fixed/60" :
              "bg-amber-50"
            }`}>
              {SEVERITY_ICON[alert.severity] ?? <Bell size={18} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-space-sm mb-space-2xs flex-wrap">
                <h3 className="font-inter text-body-md font-semibold text-on-surface">{alert.title}</h3>
                {alert.isFromApi && <span className="badge-info text-xs">REAL API</span>}
              </div>
              <p className="font-inter text-body-sm text-on-surface-variant mb-space-xs line-clamp-2">{alert.description}</p>
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="font-mono text-tech-sm text-on-surface-variant">{alert.dataset}</span>
                <span className="font-mono text-tech-sm text-on-surface-variant">·</span>
                <span className="font-mono text-tech-sm text-on-surface-variant">{alert.runId}</span>
                {alert.observedValue !== undefined && (
                  <>
                    <span className="font-mono text-tech-sm text-on-surface-variant">·</span>
                    <span className="font-mono text-tech-sm text-secondary font-bold">
                      {alert.metric}: {alert.observedValue.toFixed(3)}
                    </span>
                  </>
                )}
                <span className="font-mono text-tech-sm text-on-surface-variant">·</span>
                <span className="font-mono text-tech-sm text-on-surface-variant">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm flex-shrink-0">
              <StatusBadge status={alert.severity} />
              <span className={`font-mono text-tech-sm ${
                alert.status === "Open" ? "text-error" :
                alert.status === "Investigating" ? "text-secondary" :
                "text-tertiary"
              }`}>{alert.status}</span>
              <ChevronRight size={16} className="text-outline" />
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-space-2xl">
          <CheckCircle size={32} className="text-tertiary mx-auto mb-space-md" />
          <p className="font-space text-headline-sm text-on-surface">No alerts match this filter</p>
        </div>
      )}

      {/* Alert detail drawer */}
      <Drawer
        open={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert?.title}
        subtitle={`${selectedAlert?.dataset} · ${selectedAlert?.runId}`}
      >
        {selectedAlert && (
          <div className="flex flex-col gap-space-md">
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="trough p-space-sm">
                <p className="font-mono text-tech-sm text-on-surface-variant mb-space-2xs">Severity</p>
                <StatusBadge status={selectedAlert.severity} size="md" />
              </div>
              <div className="trough p-space-sm">
                <p className="font-mono text-tech-sm text-on-surface-variant mb-space-2xs">Status</p>
                <p className="font-mono text-tech-val font-semibold text-on-surface">{selectedAlert.status}</p>
              </div>
              {selectedAlert.observedValue !== undefined && (
                <div className="trough p-space-sm">
                  <p className="font-mono text-tech-sm text-on-surface-variant mb-space-2xs">Observed</p>
                  <p className="font-mono text-tech-display text-error">{selectedAlert.observedValue.toFixed(4)}</p>
                </div>
              )}
              {selectedAlert.threshold !== undefined && (
                <div className="trough p-space-sm">
                  <p className="font-mono text-tech-sm text-on-surface-variant mb-space-2xs">Threshold</p>
                  <p className="font-mono text-tech-display text-on-surface">{selectedAlert.threshold.toFixed(4)}</p>
                </div>
              )}
            </div>
            <div className="card p-space-md">
              <h4 className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mb-space-sm">Description</h4>
              <p className="font-inter text-body-sm text-on-surface">{selectedAlert.description}</p>
            </div>
            <div className="card p-space-md flex flex-col gap-space-xs">
              <div className="flex justify-between">
                <span className="font-mono text-tech-sm text-on-surface-variant">Dataset</span>
                <span className="font-mono text-tech-val text-on-surface">{selectedAlert.dataset}</span>
              </div>
              {selectedAlert.feature && (
                <div className="flex justify-between">
                  <span className="font-mono text-tech-sm text-on-surface-variant">Feature</span>
                  <span className="font-mono text-tech-val text-on-surface">{selectedAlert.feature}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-mono text-tech-sm text-on-surface-variant">Run ID</span>
                <span className="font-mono text-tech-val text-on-surface">{selectedAlert.runId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-tech-sm text-on-surface-variant">Timestamp</span>
                <span className="font-mono text-tech-sm text-on-surface-variant">{new Date(selectedAlert.timestamp).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-space-sm">
              <button className="btn-primary flex-1">Investigate</button>
              <button className="btn-secondary flex-1">Resolve</button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
