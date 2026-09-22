// DataWatch — Pipelines Architecture Page (/pipelines)
import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, ChevronRight, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import { MOCK_PIPELINES } from "../data/mockData";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Drawer } from "../components/ui/Drawer";
import type { Pipeline } from "../types/dataset";

const STAGE_COLORS: Record<string, string> = {
  success: "bg-tertiary-fixed/40 border-tertiary/30 text-tertiary",
  warning: "bg-amber-50 border-amber-400/30 text-yellow-700",
  error: "bg-error-container/50 border-error/30 text-error",
  running: "bg-primary-fixed/40 border-primary-container/30 text-primary animate-pulse",
  pending: "bg-surface-container-highest border-outline-variant/30 text-on-surface-variant",
};

function StageIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle size={14} />;
  if (status === "error") return <XCircle size={14} />;
  if (status === "warning") return <AlertTriangle size={14} />;
  return <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />;
}

export default function Pipelines() {
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);

  return (
    <div className="p-space-lg flex flex-col gap-space-lg">
      <div>
        <h1 className="font-space text-headline-md text-on-surface">Pipelines Architecture</h1>
        <p className="font-mono text-tech-sm text-on-surface-variant">
          {MOCK_PIPELINES.length} pipelines · {MOCK_PIPELINES.filter(p => p.status === "Healthy").length} healthy
        </p>
      </div>

      <div className="flex flex-col gap-space-md">
        {MOCK_PIPELINES.map((pipeline, i) => (
          <motion.div
            key={pipeline.id}
            className="card-raised p-space-md cursor-pointer hover:shadow-overlay transition-all"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => setSelectedPipeline(pipeline)}
          >
            <div className="flex items-start gap-space-md flex-wrap">
              {/* Pipeline info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-space-sm mb-space-xs flex-wrap">
                  <h3 className="font-space text-headline-sm text-on-surface">{pipeline.name}</h3>
                  <StatusBadge status={pipeline.status} />
                </div>
                <p className="font-mono text-tech-sm text-on-surface-variant mb-space-md">
                  {pipeline.datasetName} · {pipeline.lastRunId} · {pipeline.duration} / SLA {pipeline.sla}
                </p>

                {/* Stage DAG */}
                {pipeline.stages.length > 0 && (
                  <div className="flex items-center gap-0 overflow-x-auto pb-space-xs">
                    {pipeline.stages.map((stage, si) => (
                      <div key={si} className="flex items-center flex-shrink-0">
                        <div className={`flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg border ${STAGE_COLORS[stage.status] ?? STAGE_COLORS.pending}`}>
                          <StageIcon status={stage.status} />
                          <div>
                            <p className="font-mono text-tech-sm whitespace-nowrap font-semibold">{stage.name}</p>
                            <p className="font-mono text-tech-sm opacity-70">{stage.latency}</p>
                          </div>
                        </div>
                        {si < pipeline.stages.length - 1 && (
                          <div className="w-4 h-px bg-outline-variant/40 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pipeline meta */}
              <div className="flex flex-col items-end gap-space-xs text-right flex-shrink-0">
                <div className="font-mono text-tech-sm text-on-surface-variant">{pipeline.schedule}</div>
                <div className="font-mono text-tech-sm text-on-surface-variant">
                  Last: {new Date(pipeline.lastRun).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-space-xs mt-space-xs">
                  <button className="btn-ghost p-space-xs rounded-xl" onClick={e => e.stopPropagation()}>
                    <Play size={14} />
                  </button>
                  <button className="btn-ghost p-space-xs rounded-xl" onClick={e => e.stopPropagation()}>
                    <Pause size={14} />
                  </button>
                  <ChevronRight size={16} className="text-outline" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pipeline detail drawer */}
      <Drawer
        open={selectedPipeline !== null}
        onClose={() => setSelectedPipeline(null)}
        title={selectedPipeline?.name}
        subtitle={`${selectedPipeline?.datasetName} · ${selectedPipeline?.lastRunId}`}
      >
        {selectedPipeline && (
          <div className="flex flex-col gap-space-md">
            <div className="grid grid-cols-2 gap-space-sm">
              {[
                { label: "Status", value: <StatusBadge status={selectedPipeline.status} size="md" /> },
                { label: "Schedule", value: selectedPipeline.schedule },
                { label: "Last Run", value: selectedPipeline.lastRunId },
                { label: "Duration", value: selectedPipeline.duration },
                { label: "SLA", value: selectedPipeline.sla },
                { label: "Dataset", value: selectedPipeline.datasetName },
              ].map(({ label, value }) => (
                <div key={label} className="trough p-space-sm">
                  <p className="font-mono text-tech-sm text-on-surface-variant mb-space-2xs">{label}</p>
                  <div className="font-mono text-tech-val font-semibold text-on-surface">{value}</div>
                </div>
              ))}
            </div>
            <div className="card p-space-md">
              <h4 className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mb-space-sm">Stage Breakdown</h4>
              {selectedPipeline.stages.map((stage, i) => (
                <div key={i} className="flex items-center justify-between py-space-xs border-b border-outline-variant/20 last:border-0">
                  <div className="flex items-center gap-space-sm">
                    <StageIcon status={stage.status} />
                    <span className="font-mono text-tech-val text-on-surface">{stage.name}</span>
                  </div>
                  <span className="font-mono text-tech-sm text-on-surface-variant">{stage.latency}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
