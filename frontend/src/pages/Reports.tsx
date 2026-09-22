// DataWatch — Reports (/reports)
import { useState } from "react";
import { FileText, Download, Plus, BarChart2, Calendar, CheckCircle } from "lucide-react";

const REPORTS = [
  { id: "R-001", name: "Drift Incident Report — Telco Churn Run #1042", date: "Sep 16, 2026", type: "Drift", status: "Ready", size: "128 KB" },
  { id: "R-002", name: "Weekly Quality Summary — Sep 9–16", date: "Sep 16, 2026", type: "Quality", status: "Ready", size: "84 KB" },
  { id: "R-003", name: "Monthly ML Performance Review — August 2026", date: "Sep 1, 2026", type: "ML Impact", status: "Ready", size: "210 KB" },
  { id: "R-004", name: "Schema Governance Audit — Q3 2026", date: "Oct 1, 2026 (scheduled)", type: "Schema", status: "Scheduled", size: "—" },
  { id: "R-005", name: "Pipeline SLA Compliance — Sep 2026", date: "Oct 1, 2026 (scheduled)", type: "Pipeline", status: "Scheduled", size: "—" },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="p-space-lg flex flex-col gap-space-lg">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-space text-headline-md text-on-surface">Monitoring Reports & Export</h1>
          <p className="font-mono text-tech-sm text-on-surface-variant">Generate and download monitoring reports</p>
        </div>
        <button className="btn-primary gap-space-xs">
          <Plus size={16} />
          Generate Report
        </button>
      </div>

      {/* Report type tabs */}
      <div className="tab-strip">
        {["all", "drift", "quality", "ml", "schema"].map(t => (
          <button key={t} className={`tab-item ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
            {t === "all" ? "All Reports" : t === "ml" ? "ML Impact" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div className="flex flex-col gap-space-sm">
        {REPORTS.map(report => (
          <div key={report.id} className="card-raised p-space-md flex items-center gap-space-md">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              report.type === "Drift" ? "bg-secondary-fixed/40" :
              report.type === "Quality" ? "bg-amber-50" :
              report.type === "ML Impact" ? "bg-primary-fixed/30" :
              "bg-tertiary-fixed/30"
            }`}>
              {report.type === "Drift" ? <BarChart2 size={18} className="text-secondary" /> :
               report.status === "Scheduled" ? <Calendar size={18} className="text-on-surface-variant" /> :
               <FileText size={18} className="text-tertiary" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-inter text-body-md font-semibold text-on-surface">{report.name}</h3>
              <div className="flex items-center gap-space-sm mt-space-2xs">
                <span className="badge-info">{report.type}</span>
                <span className="font-mono text-tech-sm text-on-surface-variant">{report.date}</span>
                {report.size !== "—" && <span className="font-mono text-tech-sm text-on-surface-variant">{report.size}</span>}
              </div>
            </div>
            <div className="flex items-center gap-space-sm flex-shrink-0">
              {report.status === "Ready" ? (
                <>
                  <CheckCircle size={16} className="text-tertiary" />
                  <button className="btn-secondary gap-space-xs text-sm py-space-xs">
                    <Download size={14} />
                    Download
                  </button>
                </>
              ) : (
                <span className="font-mono text-tech-sm text-on-surface-variant">Scheduled</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
