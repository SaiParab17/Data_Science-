// DataWatch — Upload & Connect Data (/upload)
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Upload as UploadIcon, CheckCircle, Database, Cloud, GitBranch, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = ["Source Type", "Configure", "Schema Preview", "Validation Setup", "Review & Connect"];

const SOURCE_TYPES = [
  { id: "csv", icon: "📄", label: "CSV / File Upload", desc: "Upload CSV files for one-time or batch analysis" },
  { id: "postgres", icon: "🐘", label: "PostgreSQL", desc: "Connect to a PostgreSQL database table or view" },
  { id: "snowflake", icon: "❄️", label: "Snowflake", desc: "Connect to Snowflake data warehouse" },
  { id: "kafka", icon: "⚡", label: "Kafka Stream", desc: "Monitor a Kafka topic in micro-batch mode" },
  { id: "s3", icon: "☁️", label: "Amazon S3", desc: "Connect to S3 bucket with partitioned datasets" },
];

export default function Upload() {
  const [step, setStep] = useState(0);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [env, setEnv] = useState("Production");

  return (
    <div className="p-space-lg flex flex-col gap-space-lg">
      <div>
        <h1 className="font-space text-headline-md text-on-surface">Upload & Connect Dataset</h1>
        <p className="font-mono text-tech-sm text-on-surface-variant">Add a new data source to the monitoring observatory</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex items-center gap-space-xs cursor-pointer ${i <= step ? "" : "opacity-40"}`}
              onClick={() => i < step && setStep(i)}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-label-sm font-bold transition-all ${
                i < step ? "bg-tertiary text-on-tertiary" :
                i === step ? "bg-primary-container text-on-primary" :
                "bg-surface-container-highest text-on-surface-variant"
              }`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className="font-mono text-tech-sm text-on-surface-variant whitespace-nowrap hidden md:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-space-sm transition-all ${i < step ? "bg-tertiary" : "bg-outline-variant/30"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="card-raised p-space-lg min-h-64">
        {step === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="font-space text-headline-sm text-on-surface mb-space-md">Select Data Source Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
              {SOURCE_TYPES.map(src => (
                <button
                  key={src.id}
                  onClick={() => setSelectedSource(src.id)}
                  className={`p-space-md rounded-xl text-left border-2 transition-all ${
                    selectedSource === src.id
                      ? "border-primary-container bg-primary-fixed/20"
                      : "border-outline-variant/30 hover:border-outline hover:bg-surface-container-high"
                  }`}
                >
                  <div className="text-2xl mb-space-sm">{src.icon}</div>
                  <h3 className="font-space text-headline-sm text-on-surface">{src.label}</h3>
                  <p className="font-inter text-body-sm text-on-surface-variant">{src.desc}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-space-md">
            <h2 className="font-space text-headline-sm text-on-surface">Configure Dataset</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div>
                <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">Dataset Name *</label>
                <input
                  className="w-full bg-surface-container-highest px-space-md py-space-sm rounded-xl font-mono text-tech-val text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.06)" }}
                  placeholder="e.g., Customer Churn Batch"
                  value={datasetName}
                  onChange={e => setDatasetName(e.target.value)}
                />
              </div>
              <div>
                <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">Environment</label>
                <div className="flex gap-space-xs">
                  {["Production", "Staging", "Development"].map(e => (
                    <button
                      key={e}
                      onClick={() => setEnv(e)}
                      className={`flex-1 py-space-sm rounded-xl font-mono text-tech-sm transition-all ${
                        env === e ? "bg-primary-container text-on-primary" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">Monitoring Cadence</label>
                <select className="w-full bg-surface-container-highest px-space-md py-space-sm rounded-xl font-mono text-tech-val text-on-surface focus:outline-none" style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.06)" }}>
                  <option>Daily @ 02:00 UTC</option>
                  <option>Hourly</option>
                  <option>Every 5 minutes</option>
                  <option>Weekly</option>
                  <option>Manual only</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">PSI Drift Threshold</label>
                <input
                  type="number"
                  defaultValue="0.25"
                  step="0.05"
                  min="0.05"
                  max="0.50"
                  className="w-full bg-surface-container-highest px-space-md py-space-sm rounded-xl font-mono text-tech-val text-on-surface focus:outline-none"
                  style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.06)" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {(step === 2 || step === 3) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-space-md">
            <h2 className="font-space text-headline-sm text-on-surface">
              {step === 2 ? "Schema Preview (Auto-detected)" : "Validation Suite Configuration"}
            </h2>
            {step === 2 ? (
              <div className="card overflow-hidden">
                <table className="data-table">
                  <thead><tr><th>Column</th><th>Detected Type</th><th>Nullability</th><th>Sample Value</th></tr></thead>
                  <tbody>
                    {["customerID → VARCHAR", "MonthlyCharges → FLOAT64", "Contract → VARCHAR", "Churn → VARCHAR", "tenure → INT64"].map(col => {
                      const [name, type] = col.split(" → ");
                      return (
                        <tr key={name}>
                          <td><span className="font-mono text-tech-val font-semibold text-on-surface">{name}</span></td>
                          <td><span className="badge-info uppercase">{type}</span></td>
                          <td><span className="font-mono text-tech-sm text-tertiary">NOT NULL</span></td>
                          <td><span className="font-mono text-tech-sm text-on-surface-variant">—</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col gap-space-sm">
                {["Null value checks for all columns", "Row count within ±20% of reference", "MonthlyCharges: 0–200 range", "Churn: only 'Yes' or 'No' values", "PSI drift threshold: 0.25"].map((exp, i) => (
                  <div key={i} className="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-container-highest">
                    <CheckCircle size={16} className="text-tertiary flex-shrink-0" />
                    <span className="font-mono text-tech-val text-on-surface">{exp}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-space-md">
            <h2 className="font-space text-headline-sm text-on-surface">Review & Connect</h2>
            <div className="grid grid-cols-2 gap-space-sm">
              {[
                { label: "Name", value: datasetName || "—" },
                { label: "Source", value: SOURCE_TYPES.find(s => s.id === selectedSource)?.label ?? "—" },
                { label: "Environment", value: env },
                { label: "Cadence", value: "Daily @ 02:00 UTC" },
              ].map(({ label, value }) => (
                <div key={label} className="trough p-space-sm">
                  <p className="font-mono text-tech-sm text-on-surface-variant mb-space-2xs">{label}</p>
                  <p className="font-mono text-tech-val text-on-surface font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <button className="btn-primary py-space-sm px-space-xl self-start gap-space-xs" onClick={() => window.location.href = "/datasets"}>
              <Database size={16} />
              Connect & Start Monitoring
            </button>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="btn-secondary gap-space-xs disabled:opacity-40"
        >
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 0 && !selectedSource}
            className="btn-primary gap-space-xs disabled:opacity-40"
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
