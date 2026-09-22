// DataWatch — History (/history)
import { MOCK_RUN_HISTORY } from "../data/mockData";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function History() {
  const trendData = MOCK_RUN_HISTORY.slice().reverse().map(r => ({
    run: r.runId,
    quality: r.qualityScore,
    psi: r.maxPsi,
  }));

  return (
    <div className="p-space-lg flex flex-col gap-space-lg">
      <div>
        <h1 className="font-space text-headline-md text-on-surface">Monitoring History & Trends</h1>
        <p className="font-mono text-tech-sm text-on-surface-variant">Run history for Telco Customer Churn · Last 20 runs</p>
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        <div className="card p-space-md">
          <h3 className="font-space text-headline-sm text-on-surface mb-space-md">Quality Score Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(116,118,133,0.1)" />
              <XAxis dataKey="run" tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#747685" }} />
              <YAxis domain={[88, 100]} tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#747685" }} />
              <Tooltip />
              <Area type="monotone" dataKey="quality" stroke="#145538" fill="rgba(20,85,56,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-space-md">
          <h3 className="font-space text-headline-sm text-on-surface mb-space-md">Max PSI Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(116,118,133,0.1)" />
              <XAxis dataKey="run" tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#747685" }} />
              <YAxis tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#747685" }} />
              <Tooltip />
              <Area type="monotone" dataKey="psi" stroke="#ba1a1a" fill="rgba(186,26,26,0.08)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Run history table */}
      <div className="card overflow-hidden">
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
    </div>
  );
}
