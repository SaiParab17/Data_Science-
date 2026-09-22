// DataWatch — Landing Page (/)
import { NavLink } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { ArrowRight, Activity, Shield, Zap, Eye, AlertTriangle, CheckCircle, Database, GitBranch } from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: Activity,
    title: "Real-Time Drift Detection",
    subtitle: "PSI · KS Test · Wasserstein · JS Divergence",
    description: "Statistically rigorous distribution monitoring. Upload reference and current batches — get feature-level PSI, KS, Wasserstein, and Jensen-Shannon scores instantly.",
    badge: "LIVE",
    badgeColor: "badge-critical",
  },
  {
    icon: Shield,
    title: "Data Quality Validation",
    subtitle: "Great Expectations Integration",
    description: "Configure expectation suites against your schema. Null constraints, value ranges, distribution bounds — validated every run.",
    badge: "GX v0.18",
    badgeColor: "badge-info",
  },
  {
    icon: Eye,
    title: "Schema Governance",
    subtitle: "Diff · Freeze · Alerts",
    description: "Column additions, type changes, deletions — all surfaced as structured schema diff events. Freeze schema versions with one click.",
    badge: "DDL AWARE",
    badgeColor: "badge-stable",
  },
  {
    icon: Zap,
    title: "ML Model Impact",
    subtitle: "F1 · Precision · AUC Tracking",
    description: "Correlate distribution drift with downstream model degradation. Catch score regression before it reaches your inference SLA.",
    badge: "ML OPS",
    badgeColor: "badge-warning",
  },
];

const METRICS = [
  { value: "6", label: "Live Datasets", sublabel: "Production + Staging" },
  { value: "2.4M+", label: "Rows/Hour", sublabel: "Peak throughput" },
  { value: "0.312", label: "Max PSI Score", sublabel: "MonthlyCharges drift" },
  { value: "87%", label: "Platform Health", sublabel: "Cross-layer" },
];

const INCIDENT_STEPS = [
  { stage: "Data Ingest", status: "✓ PASSED", note: "6,981 rows ingested" },
  { stage: "Profile Engine", status: "✓ PASSED", note: "21 features profiled" },
  { stage: "GX Validation", status: "⚠ WARNING", note: "2 expectations failed" },
  { stage: "Schema Monitor", status: "! ALERT", note: "New column detected" },
  { stage: "Drift Engine", status: "✕ CRITICAL", note: "PSI 0.312 · MonthlyCharges" },
  { stage: "ML Evaluation", status: "⚠ WARNING", note: "F1 −4.0pp from baseline" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      <Header variant="landing" />

      {/* Hero */}
      <section className="pt-32 pb-space-xl px-margin">
        <div className="max-w-7xl mx-auto">
          {/* Signal bar */}
          <div className="flex items-center gap-space-sm mb-space-lg">
            <div className="flex items-center gap-space-xs bg-error-container/40 px-space-sm py-space-xs rounded-xl border border-error/25">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
              <span className="font-mono text-label-sm text-on-error-container uppercase tracking-wider">Critical Drift Detected · Run #1042 · MonthlyCharges PSI 0.312</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-xl items-center">
            {/* Left: Manifesto */}
            <div>
              <h1 className="font-space text-headline-xl text-on-surface leading-tight mb-space-md">
                Data pipelines break quietly.{" "}
                <span className="text-primary">DataWatch</span>{" "}
                makes them speak.
              </h1>
              <p className="font-inter text-body-lg text-on-surface-variant mb-space-xl max-w-lg">
                Production-grade data pipeline quality and drift monitoring platform. Statistical
                distribution monitoring, Great Expectations validation, schema governance, and ML
                model impact analysis — unified in one observatory.
              </p>
              <div className="flex items-center gap-space-md flex-wrap">
                <NavLink to="/dashboard" className="btn-primary px-space-lg py-space-sm text-base">
                  Open Observatory
                  <ArrowRight size={18} />
                </NavLink>
                <NavLink to="/datasets/DS-TELCO-001" className="btn-secondary px-space-lg py-space-sm text-base">
                  <AlertTriangle size={16} className="text-secondary" />
                  View Live Drift
                </NavLink>
              </div>
            </div>

            {/* Right: Live monitor instrument */}
            <motion.div
              className="card-raised p-space-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-space-md">
                <div>
                  <h2 className="font-space text-headline-sm text-on-surface">Telco Customer Churn</h2>
                  <p className="font-mono text-tech-sm text-on-surface-variant">Production · Run #1042 · 14:42 UTC</p>
                </div>
                <span className="badge-critical animate-pulse">CRITICAL</span>
              </div>

              {/* Incident cascade */}
              <div className="flex flex-col gap-space-xs">
                {INCIDENT_STEPS.map((step, i) => (
                  <div key={i} className={`flex items-center justify-between p-space-sm rounded-lg ${
                    step.status.startsWith("✕") ? "bg-error-container/25 border border-error/20" :
                    step.status.startsWith("!") ? "bg-secondary-fixed/20 border border-secondary/20" :
                    step.status.startsWith("⚠") ? "bg-amber-50/60 border border-amber-400/20" :
                    "bg-surface-container-highest"
                  }`}>
                    <div className="flex items-center gap-space-sm">
                      <span className="font-mono text-label-sm text-on-surface-variant w-28">{step.stage}</span>
                      <span className={`font-mono text-tech-val font-bold ${
                        step.status.startsWith("✕") ? "text-error" :
                        step.status.startsWith("!") ? "text-secondary" :
                        step.status.startsWith("⚠") ? "text-yellow-600" :
                        "text-tertiary"
                      }`}>{step.status}</span>
                    </div>
                    <span className="font-mono text-tech-sm text-on-surface-variant">{step.note}</span>
                  </div>
                ))}
              </div>

              {/* Drift metric highlight */}
              <div className="mt-space-md p-space-md trough">
                <div className="flex justify-between items-baseline mb-space-xs">
                  <span className="font-mono text-label-sm text-on-surface-variant uppercase">MonthlyCharges PSI</span>
                  <span className="font-mono text-tech-display text-error">0.312</span>
                </div>
                <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-error"
                    initial={{ width: 0 }}
                    animate={{ width: "62.4%" }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between mt-space-xs">
                  <span className="font-mono text-tech-sm text-on-surface-variant">0.0</span>
                  <span className="font-mono text-tech-sm text-error">Threshold 0.25</span>
                  <span className="font-mono text-tech-sm text-on-surface-variant">0.5+</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live metrics */}
      <section className="py-space-xl bg-surface-container px-margin">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.label}
                className="card-raised p-space-md text-center"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="font-mono text-tech-display text-primary">{m.value}</div>
                <div className="font-space text-headline-sm text-on-surface mt-space-xs">{m.label}</div>
                <div className="font-mono text-tech-sm text-on-surface-variant">{m.sublabel}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-space-2xl px-margin">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-space-xl">
            <span className="font-mono text-label-sm text-primary uppercase tracking-widest">Four Monitoring Layers</span>
            <h2 className="font-space text-headline-lg text-on-surface mt-space-sm">Full-stack pipeline observability</h2>
            <p className="font-inter text-body-lg text-on-surface-variant mt-space-sm max-w-xl mx-auto">
              From raw data ingest to model serving — every layer monitored, every anomaly surfaced.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="card-raised p-space-lg"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-space-md">
                    <div className="w-12 h-12 rounded-xl bg-primary-fixed/30 flex items-center justify-center">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <span className={`${feature.badgeColor} uppercase tracking-wider`}>{feature.badge}</span>
                  </div>
                  <h3 className="font-space text-headline-sm text-on-surface">{feature.title}</h3>
                  <p className="font-mono text-tech-sm text-on-surface-variant mb-space-sm">{feature.subtitle}</p>
                  <p className="font-inter text-body-md text-on-surface-variant">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pipeline DAG Section */}
      <section className="py-space-2xl bg-surface-container px-margin">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-space-xl">
            <h2 className="font-space text-headline-lg text-on-surface">7-stage monitoring pipeline</h2>
            <p className="font-inter text-body-md text-on-surface-variant mt-space-sm">
              Every batch runs through the full validation stack — no layer skipped.
            </p>
          </div>
          <div className="flex items-center gap-0 overflow-x-auto pb-space-sm">
            {["Ingest", "Profile", "GX Valid", "Schema Diff", "Drift Engine", "ML Eval", "Audit & Report"].map((stage, i) => (
              <div key={stage} className="flex items-center flex-shrink-0">
                <div className={`px-space-md py-space-sm rounded-xl text-center ${
                  stage === "Drift Engine" ? "bg-secondary-fixed/40 border border-secondary/30" :
                  stage === "GX Valid" ? "bg-amber-50 border border-amber-400/30" :
                  "card-raised"
                }`}>
                  <div className="font-mono text-tech-sm text-on-surface-variant uppercase mb-space-2xs">STAGE {i + 1}</div>
                  <div className="font-space text-label-md text-on-surface whitespace-nowrap">{stage}</div>
                </div>
                {i < 6 && (
                  <div className="w-8 h-px bg-outline-variant flex-shrink-0 relative">
                    <ArrowRight size={10} className="text-outline absolute right-0 -top-[5px]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-space-2xl px-margin">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-raised p-space-2xl">
            <span className="badge-critical mb-space-md inline-block">Active Alert: MonthlyCharges PSI 0.312</span>
            <h2 className="font-space text-headline-lg text-on-surface mb-space-md">
              Your pipeline has an active drift incident.
            </h2>
            <p className="font-inter text-body-lg text-on-surface-variant mb-space-xl max-w-lg mx-auto">
              MonthlyCharges shifted +41% from baseline. Open the observatory to investigate and resolve.
            </p>
            <div className="flex items-center justify-center gap-space-md flex-wrap">
              <NavLink to="/dashboard" className="btn-primary px-space-xl py-space-sm text-base">
                <Activity size={18} />
                Open Dashboard
              </NavLink>
              <NavLink to="/datasets/DS-TELCO-001" className="btn-secondary px-space-xl py-space-sm text-base">
                <Database size={16} />
                Investigate Dataset
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container border-t border-outline-variant/25 py-space-lg px-margin">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-6 h-6 bg-primary-container rounded-lg flex items-center justify-center">
              <span className="text-on-primary text-xs font-bold font-mono">DW</span>
            </div>
            <span className="font-mono text-tech-sm text-on-surface-variant">DATAWATCH v2.4 · Data Pipeline Quality & Drift Monitoring Platform</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <CheckCircle size={14} className="text-tertiary" />
            <span className="font-mono text-tech-sm text-on-surface-variant">6 pipelines active · 87% platform health</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
