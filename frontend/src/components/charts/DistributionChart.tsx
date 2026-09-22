// DataWatch — Distribution Chart (Reference vs Current overlay)
// Used in the Drift Tab Feature Detail Drawer
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import type { HistogramBin } from "../../types/drift";

interface DistributionChartProps {
  referenceHistogram?: HistogramBin[];
  currentHistogram?: HistogramBin[];
  columnName: string;
  height?: number;
}

interface MergedBin {
  bin: string;
  reference: number;
  current: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-space-sm shadow-overlay">
      <p className="font-mono text-tech-sm text-on-surface-variant mb-space-xs">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-space-sm">
          <span className="font-mono text-tech-sm" style={{ color: p.color }}>
            {p.dataKey === "reference" ? "Reference" : "Current"}
          </span>
          <span className="font-mono text-tech-val text-on-surface">{p.value?.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

export function DistributionChart({
  referenceHistogram,
  currentHistogram,
  columnName,
  height = 200,
}: DistributionChartProps) {
  if (!referenceHistogram?.length || !currentHistogram?.length) {
    return (
      <div className="flex items-center justify-center h-32 text-on-surface-variant font-mono text-tech-sm">
        Distribution data not available for this column.
      </div>
    );
  }

  // Merge reference and current by bin index
  const data: MergedBin[] = referenceHistogram.map((bin, i) => ({
    bin: `${bin.binStart.toFixed(0)}`,
    reference: bin.pct,
    current: currentHistogram[i]?.pct ?? 0,
  }));

  return (
    <div>
      <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mb-space-sm">
        Distribution: {columnName}
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barGap={0} barCategoryGap="15%">
          <CartesianGrid
            vertical={false}
            stroke="rgba(116,118,133,0.12)"
          />
          <XAxis
            dataKey="bin"
            tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#747685" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#747685" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v.toFixed(1)}%`}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
            formatter={(value) => value === "reference" ? "Reference (Jan–Jun 2026)" : "Current (Batch #1042)"}
          />
          <Bar
            dataKey="reference"
            name="reference"
            fill="#b7c4ff"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="current"
            name="current"
            fill="#9f4028"
            opacity={0.8}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Categorical Distribution Chart (horizontal bars) ────────────────────────

interface CategoricalChartProps {
  referenceDistribution?: Record<string, number>;
  currentDistribution?: Record<string, number>;
  columnName: string;
}

export function CategoricalDistributionChart({
  referenceDistribution,
  currentDistribution,
  columnName,
}: CategoricalChartProps) {
  if (!referenceDistribution || !currentDistribution) {
    return (
      <div className="flex items-center justify-center h-20 text-on-surface-variant font-mono text-tech-sm">
        No distribution data.
      </div>
    );
  }

  const allKeys = Array.from(
    new Set([...Object.keys(referenceDistribution), ...Object.keys(currentDistribution)])
  ).slice(0, 8);

  const data = allKeys.map((key) => ({
    category: key.length > 18 ? key.slice(0, 18) + "…" : key,
    reference: ((referenceDistribution[key] ?? 0) * 100),
    current: ((currentDistribution[key] ?? 0) * 100),
  }));

  return (
    <div>
      <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mb-space-sm">
        Distribution: {columnName}
      </p>
      <ResponsiveContainer width="100%" height={Math.max(160, allKeys.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid horizontal={false} stroke="rgba(116,118,133,0.12)" />
          <XAxis
            type="number"
            tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#747685" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#747685" }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
            formatter={(value) => value === "reference" ? "Reference" : "Current"}
          />
          <Bar dataKey="reference" name="reference" fill="#b7c4ff" radius={[0, 3, 3, 0]} />
          <Bar dataKey="current" name="current" fill="#9f4028" opacity={0.8} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
