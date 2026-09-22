// DataWatch — Dashboard Page (/dashboard)
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart2, AlertTriangle, Activity, GitBranch, XCircle, ChevronRight, RefreshCw, Plus, FileText, Play } from "lucide-react";
import { useDriftStore } from "../store/driftStore";
import { MOCK_ALERTS, MOCK_PLATFORM_STATS, MOCK_PIPELINES } from "../data/mockData";
import { StatusBadge } from "../components/ui/StatusBadge";
import { MetricCard } from "../components/ui/MetricCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// Sparkline data
const PSI_TREND = [
  { day: "Sep 10", psi: 0.045 }, { day: "Sep 11", psi: 0.051 }, { day: "Sep 12", psi: 0.062 },
  { day: "Sep 13", psi: 0.084 }, { day: "Sep 14", psi: 0.128 }, { day: "Sep 15", psi: 0.198 },
  { day: "Sep 16", psi: 0.312 },
];

const QUALITY_TREND = [
  { day: "Sep 10", score: 99.1 }, { day: "Sep 11", score: 98.9 }, { day: "Sep 12", score: 98.4 },
  { day: "Sep 13", score: 97.8 }, { day: "Sep 14", score: 96.2 }, { day: "Sep 15", score: 95.1 },
  { day: "Sep 16", score: 94.0 },
];

const MODEL_TREND = [
  { day: "Sep 10", f1: 83.2 }, { day: "Sep 11", f1: 83.0 }, { day: "Sep 12", f1: 82.8 },
  { day: "Sep 13", f1: 82.5 }, { day: "Sep 14", f1: 81.4 }, { day: "Sep 15", f1: 80.2 },
  { day: "Sep 16", f1: 79.0 },
];

const ACTIVITY = [
  { time: "14:45 UTC", msg: "ML evaluation: F1 decline observed on Churn Classifier", icon: "⚠", color: "text-secondary" },
  { time: "14:43 UTC", msg: "Quality alert: TotalCharges null rate 4.8% (threshold: 0.5%)", icon: "⚠", color: "text-secondary" },
  { time: "14:42 UTC", msg: "Critical drift: MonthlyCharges PSI 0.312 · Run #1042", icon: "✕", color: "text-error" },
  { time: "14:42 UTC", msg: "Schema alert: New column churn_probability_score detected", icon: "!", color: "text-secondary" },
  { time: "14:42 UTC", msg: "Pipeline PIPE-TELCO-001 completed with warnings (38.2s)", icon: "⚠", color: "text-secondary" },
  { time: "14:40 UTC", msg: "Drift analysis started: Telco Customer Churn Batch #1042", icon: "▶", color: "text-primary" },
  { time: "04:10 UTC", msg: "Loan underwriting: annual_income drift warning PSI 0.219", icon: "⚠", color: "text-secondary" },
  { time: "04:08 UTC", msg: "Pipeline PIPE-LOAN-002: passed (52.4s, SLA 90s)", icon: "✓", color: "text-tertiary" },
  { time: "00:02 UTC", msg: "Revenue hourly monitor #891: 2.4M rows · healthy", icon: "✓", color: "text-tertiary" },
];

export default function Dashboard() {
  const { result: driftResult } = useDriftStore();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");

  const stats = MOCK_PLATFORM_STATS;
  const driftedCount = driftResult?.drifted_columns ?? 0;
  const hasRealDrift = driftResult !== null;
  const maxPsi = driftResult?.max_psi ?? stats.maxDriftPsi;
  const activeAlerts = MOCK_ALERTS.filter(a => a.status !== "Resolved").length + (driftResult?.alerts.length ?? 0);

  return (
    <div className="p-space-lg flex flex-col gap-space-lg">
      {/* Command Bar */}
      <div className="flex items-center justify-between flex-wrap gap-space-sm">
        <div>
          <h1 className="font-space text-headline-md text-on-surface">Pipeline Overview Dashboard</h1>
          <p className="font-mono text-tech-sm text-on-surface-variant">
            Workspace: Prod-ML-Inference / Customer Churn · Last sync: 14:42 UTC
          </p>
        </div>
        <div className="flex items-center gap-space-sm flex-wrap">
          {/* Time range */}
          <div className="flex items-center gap-space-2xs bg-surface-container-highest rounded-xl p-space-2xs">
            {(["24h", "7d", "30d"] as const).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-space-sm py-space-xs rounded-xl font-mono text-tech-sm transition-all ${
                  timeRange === r
                    ? "bg-surface-container-low text-on-surface shadow-tactile-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="btn-secondary gap-space-xs text-sm py-space-xs px-space-sm">
            <RefreshCw size={14} />
            Sync
          </button>
          <button className="btn-secondary gap-space-xs text-sm py-space-xs px-space-sm">
            <Play size={14} />
            Run Validation
          </button>
          <button className="btn-secondary gap-space-xs text-sm py-space-xs px-space-sm">
            <Plus size={14} />
            Add Dataset
          </button>
        </div>
      </div>

      {/* Critical Incident Banner */}
      {(hasRealDrift || stats.maxDriftPsi >= stats.psiThreshold) && (
        <motion.div
          className="bg-secondary-fixed/20 border border-secondary/35 rounded-xl p-space-md"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-space-md">
            <div className="w-10 h-10 rounded-xl bg-error-container/60 flex items-center justify-center flex-shrink-0">
              <XCircle size={20} className="text-error" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-space-sm mb-space-2xs flex-wrap">
                <span className="badge-critical">CRITICAL DRIFT</span>
                <span className="font-space text-headline-sm text-on-surface">
                  MonthlyCharges distribution shift — Run #{driftResult?.features?.[0] ? "1042" : "1042"}
                </span>
              </div>
              <p className="font-inter text-body-sm text-on-surface-variant mb-space-sm">
                PSI score{" "}
                <span className="font-mono font-bold text-error">{maxPsi.toFixed(3)}</span>{" "}
                exceeds threshold of{" "}
                <span className="font-mono font-bold">{stats.psiThreshold.toFixed(3)}</span>. Feature mean
                shifted from <span className="font-mono">${stats.referenceMean}</span> →{" "}
                <span className="font-mono font-bold text-error">${(hasRealDrift ? driftResult!.features.find(f => f.column_name === "MonthlyCharges")?.current_mean ?? stats.currentMean : stats.currentMean).toFixed(2)}</span>{" "}
                (+{stats.meanShiftPct.toFixed(1)}%). KS test p-value {stats.ksValue} confirms statistical significance.
              </p>
              <div className="flex items-center gap-space-sm flex-wrap">
                <NavLink to="/datasets/DS-TELCO-001?tab=drift" className="btn-secondary gap-space-xs text-sm py-space-xs px-space-sm">
                  <BarChart2 size={14} className="text-secondary" />
                  Investigate Drift
                </NavLink>
                <NavLink to="/alerts" className="btn-secondary gap-space-xs text-sm py-space-xs px-space-sm">
                  <AlertTriangle size={14} />
                  View Alerts
                </NavLink>
                <NavLink to="/reports" className="btn-secondary gap-space-xs text-sm py-space-xs px-space-sm">
                  <FileText size={14} />
                  Generate Report
                </NavLink>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-mono text-tech-display text-error leading-none">{maxPsi.toFixed(3)}</div>
              <div className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mt-space-2xs">PSI Max</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4 Telemetry Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
        <MetricCard
          label="Platform Health"
          value={`${stats.platformHealth}%`}
          subLabel="↓ 2.8pp"
          variant="warning"
        >
          <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden mt-space-sm">
            <div className="h-full rounded-full bg-secondary" style={{ width: `${stats.platformHealth}%` }} />
          </div>
        </MetricCard>

        <MetricCard
          label="Active Alerts"
          value={activeAlerts}
          subLabel={`${stats.criticalAlerts} critical`}
          variant="critical"
        >
          <div className="flex gap-space-xs mt-space-xs flex-wrap">
            <span className="badge-critical">{stats.criticalAlerts} Critical</span>
            <span className="badge-high">{stats.highAlerts} High</span>
            <span className="badge-warning">{stats.warningAlerts} Warning</span>
          </div>
        </MetricCard>

        <MetricCard
          label="Drift PSI (Max)"
          value={maxPsi.toFixed(3)}
          subLabel={maxPsi >= stats.psiThreshold ? `+${((maxPsi - stats.psiThreshold) / stats.psiThreshold * 100).toFixed(0)}% over threshold` : "Below threshold"}
          variant={maxPsi >= stats.psiThreshold ? "critical" : "default"}
        >
          {driftedCount > 0 && (
            <div className="font-mono text-tech-sm text-secondary mt-space-xs">
              {driftedCount} feature{driftedCount !== 1 ? "s" : ""} drifted
            </div>
          )}
        </MetricCard>

        <MetricCard
          label="Model F1-Score"
          value={`${stats.modelF1}%`}
          subLabel={`${stats.modelF1Change.toFixed(1)}pp vs baseline`}
          variant="warning"
        >
          <div className="font-mono text-tech-sm text-on-surface-variant mt-space-xs">
            Baseline: {stats.modelF1Baseline}%
          </div>
        </MetricCard>
      </div>

      {/* Bento Grid: 4 panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Quality Score Trend */}
        <div className="card p-space-md col-span-1">
          <div className="flex items-center justify-between mb-space-sm">
            <div>
              <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">Quality Score</p>
              <p className="font-mono text-tech-display text-on-surface">{stats.qualityScore}%</p>
            </div>
            <span className="badge-high">Declining</span>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={QUALITY_TREND}>
              <Area type="monotone" dataKey="score" stroke="#9f4028" fill="rgba(159,64,40,0.08)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="font-mono text-tech-sm text-on-surface-variant mt-space-xs">
            2 GX expectations failed · Run #1042
          </p>
        </div>

        {/* Drift PSI Trend */}
        <div className="card p-space-md col-span-1">
          <div className="flex items-center justify-between mb-space-sm">
            <div>
              <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">Drift PSI Trend</p>
              <p className="font-mono text-tech-display text-error">{maxPsi.toFixed(3)}</p>
            </div>
            <span className="badge-critical">Critical</span>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={PSI_TREND}>
              <Area type="monotone" dataKey="psi" stroke="#ba1a1a" fill="rgba(186,26,26,0.08)" strokeWidth={2} dot={false} />
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(116,118,133,0.12)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="h-1 rounded-full bg-surface-container-highest overflow-hidden mt-space-sm">
            <div className="h-full rounded-full bg-error" style={{ width: `${(maxPsi / 0.5) * 100}%` }} />
          </div>
          <p className="font-mono text-tech-sm text-error mt-space-xs">
            {((maxPsi - stats.psiThreshold) / stats.psiThreshold * 100).toFixed(0)}% over threshold · MonthlyCharges
          </p>
        </div>

        {/* ML Impact */}
        <div className="card p-space-md col-span-1">
          <div className="flex items-center justify-between mb-space-sm">
            <div>
              <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">Model F1 Trend</p>
              <p className="font-mono text-tech-display text-secondary">{stats.modelF1}%</p>
            </div>
            <span className="badge-high">↓ 4pp</span>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={MODEL_TREND}>
              <Line type="monotone" dataKey="f1" stroke="#9f4028" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="font-mono text-tech-sm text-on-surface-variant mt-space-xs">
            Churn Classifier · Baseline 83.0%
          </p>
        </div>

        {/* Pipelines */}
        <div className="card p-space-md col-span-1">
          <div className="flex items-center justify-between mb-space-sm">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">Pipelines</p>
            <NavLink to="/pipelines" className="font-mono text-tech-sm text-primary hover:underline">View all</NavLink>
          </div>
          <div className="flex flex-col gap-space-xs">
            {MOCK_PIPELINES.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="font-mono text-tech-sm text-on-surface truncate max-w-[120px]">{p.name.replace(" Validation", "").replace(" Monitor", "")}</span>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Alert queue + Activity feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-md">
        {/* Active Alerts */}
        <div className="xl:col-span-2 card p-space-md">
          <div className="flex items-center justify-between mb-space-md">
            <h2 className="font-space text-headline-sm text-on-surface">Active Alert Queue</h2>
            <NavLink to="/alerts" className="font-mono text-tech-sm text-primary hover:underline flex items-center gap-space-xs">
              View all <ChevronRight size={14} />
            </NavLink>
          </div>
          <div className="flex flex-col gap-space-xs">
            {MOCK_ALERTS.filter(a => a.status !== "Resolved").slice(0, 6).map((alert) => (
              <NavLink
                key={alert.id}
                to="/alerts"
                className="flex items-center gap-space-md p-space-sm rounded-xl hover:bg-surface-container-high transition-colors"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  alert.severity === "Critical" ? "bg-error-container/60" :
                  alert.severity === "High" ? "bg-secondary-fixed/60" :
                  "bg-amber-50"
                }`}>
                  <AlertTriangle size={16} className={
                    alert.severity === "Critical" ? "text-error" :
                    alert.severity === "High" ? "text-secondary" :
                    "text-yellow-600"
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-body-sm text-on-surface truncate">{alert.title}</p>
                  <p className="font-mono text-tech-sm text-on-surface-variant">{alert.dataset} · {alert.runId} · {new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
                <div className="flex items-center gap-space-xs flex-shrink-0">
                  <StatusBadge status={alert.severity} />
                  <ChevronRight size={14} className="text-outline" />
                </div>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card p-space-md">
          <div className="flex items-center justify-between mb-space-md">
            <h2 className="font-space text-headline-sm text-on-surface">Activity Feed</h2>
            <Activity size={16} className="text-on-surface-variant" />
          </div>
          <div className="flex flex-col gap-space-xs overflow-y-auto max-h-64">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-space-xs text-sm">
                <span className={`font-mono font-bold flex-shrink-0 ${a.color}`}>{a.icon}</span>
                <div>
                  <p className="font-inter text-body-sm text-on-surface leading-snug">{a.msg}</p>
                  <p className="font-mono text-tech-sm text-on-surface-variant">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
