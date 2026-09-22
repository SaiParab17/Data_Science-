// DataWatch — Feature Detail Drawer (opened from Drift Table row click)
import { Drawer } from "../ui/Drawer";
import { StatusBadge } from "../ui/StatusBadge";
import { DistributionChart, CategoricalDistributionChart } from "../charts/DistributionChart";
import type { FeatureDriftResult } from "../../types/drift";
import { TrendingUp, AlertTriangle, BarChart2 } from "lucide-react";

interface FeatureDrawerProps {
  feature: FeatureDriftResult | null;
  open: boolean;
  onClose: () => void;
  psiThreshold?: number;
}

function MetricRow({ label, value, subValue, highlight }: {
  label: string;
  value: string | number;
  subValue?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-space-xs px-space-sm rounded-lg ${highlight ? "bg-secondary-fixed/20" : ""}`}>
      <span className="font-mono text-tech-sm text-on-surface-variant">{label}</span>
      <div className="text-right">
        <span className={`font-mono text-tech-val font-semibold ${highlight ? "text-secondary" : "text-on-surface"}`}>
          {value}
        </span>
        {subValue && (
          <div className="font-mono text-tech-sm text-on-surface-variant">{subValue}</div>
        )}
      </div>
    </div>
  );
}

export function FeatureDrawer({ feature, open, onClose, psiThreshold = 0.25 }: FeatureDrawerProps) {
  if (!feature) return null;

  const isDrifted = feature.status === "DRIFT";
  const isWarning = feature.status === "WARNING";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={feature.column_name}
      subtitle={`${feature.data_type} · PSI ${feature.psi.toFixed(3)} · ${feature.severity}`}
      width="lg"
    >
      <div className="flex flex-col gap-space-lg">
        {/* Status header */}
        <div className={`p-space-md rounded-xl border ${
          isDrifted
            ? "bg-secondary-fixed/15 border-secondary/30"
            : isWarning
            ? "bg-yellow-50/50 border-yellow-400/30"
            : "bg-tertiary-fixed/15 border-tertiary/30"
        }`}>
          <div className="flex items-start gap-space-sm">
            {isDrifted ? (
              <AlertTriangle size={18} className="text-secondary mt-0.5 flex-shrink-0" />
            ) : (
              <BarChart2 size={18} className="text-tertiary mt-0.5 flex-shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-space-sm mb-space-xs">
                <StatusBadge status={feature.severity} />
                <StatusBadge status={feature.status} />
              </div>
              <p className="font-inter text-body-sm text-on-surface">
                {isDrifted
                  ? `PSI score of ${feature.psi.toFixed(3)} exceeds the configured threshold of ${psiThreshold.toFixed(3)}. Significant distribution shift detected.`
                  : isWarning
                  ? `PSI score of ${feature.psi.toFixed(3)} is approaching the threshold of ${psiThreshold.toFixed(3)}. Monitoring elevated.`
                  : `PSI score of ${feature.psi.toFixed(3)} is within the stable range (< ${psiThreshold.toFixed(3)}).`}
              </p>
            </div>
          </div>
        </div>

        {/* Statistical Metrics */}
        <div>
          <h3 className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mb-space-sm">
            Drift Metrics
          </h3>
          <div className="card p-space-xs flex flex-col gap-space-2xs">
            <MetricRow
              label="PSI Score"
              value={feature.psi.toFixed(4)}
              subValue={`threshold: ${psiThreshold.toFixed(3)}`}
              highlight={feature.psi >= psiThreshold}
            />
            {feature.ks_statistic !== undefined && (
              <MetricRow
                label="KS Statistic"
                value={feature.ks_statistic.toFixed(4)}
                subValue={`p-value: ${feature.ks_p_value?.toFixed(4)}`}
                highlight={(feature.ks_p_value ?? 1) < 0.05}
              />
            )}
            {feature.wasserstein_distance !== undefined && (
              <MetricRow
                label="Wasserstein Distance"
                value={feature.wasserstein_distance.toFixed(4)}
              />
            )}
            {feature.js_divergence !== undefined && (
              <MetricRow
                label="Jensen-Shannon Divergence"
                value={feature.js_divergence.toFixed(4)}
              />
            )}
          </div>
        </div>

        {/* Descriptive Stats (numeric only) */}
        {feature.data_type === "numeric" && feature.reference_mean !== undefined && (
          <div>
            <h3 className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mb-space-sm">
              Descriptive Statistics
            </h3>
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="trough p-space-sm">
                <p className="font-mono text-tech-sm text-on-surface-variant mb-space-xs">Reference Mean</p>
                <p className="font-mono text-tech-display text-primary">
                  {feature.reference_mean.toFixed(2)}
                </p>
                <p className="font-mono text-tech-sm text-on-surface-variant">
                  σ {feature.reference_std?.toFixed(2)}
                </p>
              </div>
              <div className={`trough p-space-sm ${isDrifted ? "border border-secondary/30" : ""}`}>
                <p className="font-mono text-tech-sm text-on-surface-variant mb-space-xs">Current Mean</p>
                <p className={`font-mono text-tech-display ${isDrifted ? "text-secondary" : "text-on-surface"}`}>
                  {feature.current_mean?.toFixed(2)}
                </p>
                <p className="font-mono text-tech-sm text-on-surface-variant">
                  σ {feature.current_std?.toFixed(2)}
                </p>
              </div>
            </div>
            {feature.mean_change_percent !== undefined && (
              <div className={`flex items-center gap-space-xs mt-space-sm p-space-sm rounded-xl ${
                Math.abs(feature.mean_change_percent) > 10
                  ? "bg-secondary-fixed/20"
                  : "bg-surface-container-highest"
              }`}>
                <TrendingUp size={16} className={Math.abs(feature.mean_change_percent) > 10 ? "text-secondary" : "text-on-surface-variant"} />
                <span className="font-mono text-tech-val">
                  Mean shift:{" "}
                  <strong className={Math.abs(feature.mean_change_percent) > 10 ? "text-secondary" : "text-on-surface"}>
                    {feature.mean_change_percent > 0 ? "+" : ""}
                    {feature.mean_change_percent.toFixed(1)}%
                  </strong>{" "}
                  vs reference
                </span>
              </div>
            )}
          </div>
        )}

        {/* Missing Data */}
        <div className="grid grid-cols-2 gap-space-sm">
          <div className="card p-space-sm text-center">
            <p className="font-mono text-tech-sm text-on-surface-variant">Reference Missing</p>
            <p className="font-mono text-tech-val text-on-surface font-semibold">{feature.reference_missing_pct.toFixed(2)}%</p>
          </div>
          <div className={`card p-space-sm text-center ${feature.current_missing_pct > 2 ? "border-secondary/30" : ""}`}>
            <p className="font-mono text-tech-sm text-on-surface-variant">Current Missing</p>
            <p className={`font-mono text-tech-val font-semibold ${feature.current_missing_pct > 2 ? "text-secondary" : "text-on-surface"}`}>
              {feature.current_missing_pct.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="card p-space-md">
          {feature.data_type === "numeric" ? (
            <DistributionChart
              referenceHistogram={feature.reference_histogram}
              currentHistogram={feature.current_histogram}
              columnName={feature.column_name}
              height={220}
            />
          ) : (
            <CategoricalDistributionChart
              referenceDistribution={feature.reference_distribution}
              currentDistribution={feature.current_distribution}
              columnName={feature.column_name}
            />
          )}
        </div>
      </div>
    </Drawer>
  );
}
