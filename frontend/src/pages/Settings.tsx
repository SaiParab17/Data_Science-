// DataWatch — Settings (/settings)
import { useState } from "react";
import { Save, User, Bell, Database, Shield, FileText } from "lucide-react";

const TABS = [
  { id: "general", label: "General", icon: Database },
  { id: "monitoring", label: "Monitoring", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Database },
  { id: "team", label: "Team", icon: User },
  { id: "audit", label: "Audit Logs", icon: FileText },
];

const TEAM_MEMBERS = [
  { name: "Elena Vance", role: "Admin", email: "evance@company.com", avatar: "EV" },
  { name: "James Park", role: "Data Engineer", email: "jpark@company.com", avatar: "JP" },
  { name: "Sara Chen", role: "ML Engineer", email: "schen@company.com", avatar: "SC" },
  { name: "Omar Hassan", role: "Viewer", email: "ohassan@company.com", avatar: "OH" },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [psiThreshold, setPsiThreshold] = useState("0.25");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-space-lg flex flex-col gap-space-lg">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-space text-headline-md text-on-surface">Settings & Governance</h1>
          <p className="font-mono text-tech-sm text-on-surface-variant">Platform configuration and team management</p>
        </div>
        <button
          onClick={handleSave}
          className={`btn-primary gap-space-xs ${saved ? "bg-tertiary" : ""}`}
        >
          <Save size={16} />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="flex gap-space-lg">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="flex flex-col gap-space-2xs">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`nav-item gap-space-sm text-sm ${activeTab === id ? "active" : ""}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings content */}
        <div className="flex-1 min-w-0">
          {activeTab === "general" && (
            <div className="card p-space-lg flex flex-col gap-space-lg">
              <h2 className="font-space text-headline-sm text-on-surface">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div>
                  <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">Platform Name</label>
                  <input defaultValue="DataWatch Observatory" className="w-full bg-surface-container-highest px-space-md py-space-sm rounded-xl font-mono text-tech-val text-on-surface focus:outline-none" style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.06)" }} />
                </div>
                <div>
                  <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">Organization</label>
                  <input defaultValue="ML-Ops / Production" className="w-full bg-surface-container-highest px-space-md py-space-sm rounded-xl font-mono text-tech-val text-on-surface focus:outline-none" style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.06)" }} />
                </div>
                <div>
                  <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">Default Timezone</label>
                  <select className="w-full bg-surface-container-highest px-space-md py-space-sm rounded-xl font-mono text-tech-val text-on-surface focus:outline-none" style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.06)" }}>
                    <option>UTC</option>
                    <option>US/Eastern</option>
                    <option>US/Pacific</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">Backend API URL</label>
                  <input defaultValue="http://localhost:8000" className="w-full bg-surface-container-highest px-space-md py-space-sm rounded-xl font-mono text-tech-val text-on-surface focus:outline-none" style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.06)" }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "monitoring" && (
            <div className="card p-space-lg flex flex-col gap-space-md">
              <h2 className="font-space text-headline-sm text-on-surface">Monitoring Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div>
                  <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">PSI Drift Threshold (default)</label>
                  <input type="number" value={psiThreshold} step="0.05" min="0.05" max="0.50" onChange={e => setPsiThreshold(e.target.value)} className="w-full bg-surface-container-highest px-space-md py-space-sm rounded-xl font-mono text-tech-val text-on-surface focus:outline-none" style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.06)" }} />
                  <p className="font-mono text-tech-sm text-on-surface-variant mt-space-xs">Stable &lt;0.10 · Warning 0.10–0.25 · Drift &gt;0.25</p>
                </div>
                <div>
                  <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">Alert Notification Email</label>
                  <input defaultValue="mlops-alerts@company.com" className="w-full bg-surface-container-highest px-space-md py-space-sm rounded-xl font-mono text-tech-val text-on-surface focus:outline-none" style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.06)" }} />
                </div>
                {[
                  { label: "Enable Slack Notifications", default: true },
                  { label: "Enable Email Alerts on Critical", default: true },
                  { label: "Auto-create Incident on PSI > 0.30", default: false },
                  { label: "KS Test p-value alert threshold < 0.05", default: true },
                ].map(opt => (
                  <div key={opt.label} className="flex items-center justify-between p-space-sm bg-surface-container-highest rounded-xl">
                    <span className="font-mono text-tech-val text-on-surface">{opt.label}</span>
                    <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${opt.default ? "bg-tertiary" : "bg-surface-container-high border border-outline-variant/40"}`}>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${opt.default ? "right-0.5" : "left-0.5"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="card p-space-lg flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <h2 className="font-space text-headline-sm text-on-surface">Team Members</h2>
                <button className="btn-secondary gap-space-xs text-sm">+ Invite Member</button>
              </div>
              <div className="flex flex-col gap-space-xs">
                {TEAM_MEMBERS.map(m => (
                  <div key={m.email} className="flex items-center gap-space-md p-space-sm rounded-xl hover:bg-surface-container-high">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed/40 flex items-center justify-center font-mono text-tech-val font-bold text-primary flex-shrink-0">
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-body-md font-semibold text-on-surface">{m.name}</p>
                      <p className="font-mono text-tech-sm text-on-surface-variant">{m.email}</p>
                    </div>
                    <span className="badge-info">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="card p-space-lg flex flex-col gap-space-md">
              <h2 className="font-space text-headline-sm text-on-surface">Integrations</h2>
              {[
                { name: "FastAPI Backend", status: "Connected", url: "http://localhost:8000", desc: "Drift analysis engine" },
                { name: "Slack", status: "Configured", url: "#alerts-mlops", desc: "Alert notifications" },
                { name: "PostgreSQL", status: "Not configured", url: "—", desc: "Data source connector" },
                { name: "Snowflake", status: "Not configured", url: "—", desc: "Cloud warehouse connector" },
              ].map(integration => (
                <div key={integration.name} className="flex items-center gap-space-md p-space-md bg-surface-container-highest rounded-xl">
                  <div className="flex-1">
                    <p className="font-inter text-body-md font-semibold text-on-surface">{integration.name}</p>
                    <p className="font-mono text-tech-sm text-on-surface-variant">{integration.desc} · {integration.url}</p>
                  </div>
                  <span className={integration.status === "Connected" || integration.status === "Configured" ? "badge-stable" : "badge-info"}>
                    {integration.status}
                  </span>
                  <button className="btn-secondary text-sm py-space-xs px-space-sm">Configure</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "audit" && (
            <div className="card p-space-lg flex flex-col gap-space-md">
              <h2 className="font-space text-headline-sm text-on-surface">Audit Logs</h2>
              {[
                { time: "14:42", user: "System", action: "Drift analysis triggered", detail: "Run #1042 · Telco Churn" },
                { time: "14:40", user: "evance@company.com", action: "Manual pipeline run initiated", detail: "PIPE-TELCO-001" },
                { time: "04:08", user: "System", action: "Scheduled drift analysis", detail: "Run #344 · Loan Underwriting" },
                { time: "Sep 15 09:12", user: "jpark@company.com", action: "PSI threshold updated", detail: "0.20 → 0.25" },
                { time: "Sep 15 08:30", user: "evance@company.com", action: "Alert resolved", detail: "AL-980 · Revenue SLA" },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-space-md border-b border-outline-variant/20 pb-space-sm last:border-0">
                  <span className="font-mono text-tech-sm text-on-surface-variant w-28 flex-shrink-0">{log.time}</span>
                  <div>
                    <p className="font-mono text-tech-val text-on-surface">{log.action}</p>
                    <p className="font-mono text-tech-sm text-on-surface-variant">{log.user} · {log.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
