// DataWatch — Datasets Catalog (/datasets)
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Search, Grid3X3, List, Plus, Filter, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { MOCK_DATASETS } from "../data/mockData";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Dataset } from "../types/dataset";

const SOURCE_ICONS: Record<string, string> = {
  CSV: "📄", PostgreSQL: "🐘", Snowflake: "❄️", Kafka: "⚡", S3: "☁️",
};

function DatasetCard({ ds }: { ds: Dataset }) {
  const qualityPct = ds.qualityScore ?? 100;
  return (
    <NavLink to={`/datasets/${ds.id}`}>
      <motion.div
        className="card-raised p-space-md h-full flex flex-col gap-space-sm cursor-pointer hover:shadow-overlay transition-all"
        whileHover={{ y: -2 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="text-2xl">{SOURCE_ICONS[ds.sourceType] ?? "📊"}</span>
            <div>
              <h3 className="font-space text-headline-sm text-on-surface leading-tight">{ds.name}</h3>
              <p className="font-mono text-tech-sm text-on-surface-variant">{ds.source}</p>
            </div>
          </div>
          <StatusBadge status={ds.status} />
        </div>

        <p className="font-inter text-body-sm text-on-surface-variant flex-1 line-clamp-2">
          {ds.description}
        </p>

        <div className="grid grid-cols-3 gap-space-xs">
          {[
            { label: "Rows", value: ds.rowsFormatted },
            { label: "Features", value: ds.features },
            { label: "Quality", value: ds.qualityScore ? `${ds.qualityScore}%` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="trough p-space-xs text-center">
              <p className="font-mono text-tech-val text-on-surface font-semibold">{value}</p>
              <p className="font-mono text-tech-sm text-on-surface-variant">{label}</p>
            </div>
          ))}
        </div>

        {ds.maxDriftPsi !== undefined && (
          <div className="flex items-center gap-space-sm">
            <span className="font-mono text-tech-sm text-on-surface-variant">PSI Max</span>
            <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className={`h-full rounded-full ${ds.maxDriftPsi >= 0.25 ? "bg-error" : ds.maxDriftPsi >= 0.10 ? "bg-secondary" : "bg-tertiary"}`}
                style={{ width: `${Math.min(ds.maxDriftPsi / 0.5 * 100, 100)}%` }}
              />
            </div>
            <span className={`font-mono text-tech-val font-bold ${ds.maxDriftPsi >= 0.25 ? "text-error" : "text-on-surface"}`}>
              {ds.maxDriftPsi.toFixed(3)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-outline-variant/20 pt-space-sm">
          <div className="flex gap-space-xs flex-wrap">
            {ds.tags.slice(0, 3).map(tag => (
              <span key={tag} className="badge-info">{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-space-xs text-primary">
            <span className="font-mono text-tech-sm">Explore</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </motion.div>
    </NavLink>
  );
}

export default function Datasets() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = MOCK_DATASETS.filter(ds => {
    const matchesSearch = ds.name.toLowerCase().includes(search.toLowerCase()) ||
      ds.source.toLowerCase().includes(search.toLowerCase()) ||
      ds.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || ds.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-space-lg flex flex-col gap-space-lg">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-space-sm">
        <div>
          <h1 className="font-space text-headline-md text-on-surface">Dataset Catalog</h1>
          <p className="font-mono text-tech-sm text-on-surface-variant">
            {MOCK_DATASETS.length} monitored datasets · {MOCK_DATASETS.filter(d => d.status === "Healthy").length} healthy
          </p>
        </div>
        <NavLink to="/upload" className="btn-primary gap-space-xs">
          <Plus size={16} />
          Add Dataset
        </NavLink>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-space-sm flex-wrap">
        <div className="flex items-center gap-space-xs bg-surface-container-highest px-space-md py-space-xs rounded-xl flex-1 min-w-64"
          style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.06)" }}>
          <Search size={16} className="text-outline flex-shrink-0" />
          <input
            className="bg-transparent flex-1 font-mono text-tech-val text-on-surface focus:outline-none placeholder:text-on-surface-variant"
            placeholder="Search datasets, sources, tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-space-xs">
          <Filter size={14} className="text-on-surface-variant" />
          {["all", "Healthy", "Warning", "Attention Required", "Paused"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-space-sm py-space-xs rounded-xl font-mono text-tech-sm transition-all ${
                statusFilter === s
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-space-2xs bg-surface-container-highest rounded-xl p-space-2xs">
          <button onClick={() => setViewMode("grid")} className={`p-space-xs rounded-xl ${viewMode === "grid" ? "bg-surface-container-low text-on-surface shadow-tactile-sm" : "text-on-surface-variant"}`}>
            <Grid3X3 size={16} />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-space-xs rounded-xl ${viewMode === "list" ? "bg-surface-container-low text-on-surface shadow-tactile-sm" : "text-on-surface-variant"}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Dataset grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
          {filtered.map((ds, i) => (
            <motion.div
              key={ds.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <DatasetCard ds={ds} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dataset</th><th>Source</th><th>Rows</th><th>Features</th>
                <th>Quality</th><th>Max PSI</th><th>Status</th><th>Last Run</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ds => (
                <tr key={ds.id} className="cursor-pointer" onClick={() => window.location.href = `/datasets/${ds.id}`}>
                  <td><span className="font-mono text-tech-val font-semibold text-on-surface">{ds.name}</span></td>
                  <td><span className="font-mono text-tech-sm text-on-surface-variant">{ds.source}</span></td>
                  <td><span className="font-mono text-tech-val">{ds.rowsFormatted}</span></td>
                  <td><span className="font-mono text-tech-val">{ds.features}</span></td>
                  <td><span className="font-mono text-tech-val">{ds.qualityScore ? `${ds.qualityScore}%` : "—"}</span></td>
                  <td>
                    {ds.maxDriftPsi !== undefined ? (
                      <span className={`font-mono text-tech-val font-semibold ${ds.maxDriftPsi >= 0.25 ? "text-error" : ds.maxDriftPsi >= 0.10 ? "text-secondary" : "text-tertiary"}`}>
                        {ds.maxDriftPsi.toFixed(3)}
                      </span>
                    ) : <span className="text-on-surface-variant">—</span>}
                  </td>
                  <td><StatusBadge status={ds.status} /></td>
                  <td><span className="font-mono text-tech-sm text-on-surface-variant">{ds.latestRun ?? "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-space-2xl">
          <p className="font-mono text-tech-val text-on-surface-variant">No datasets match your search.</p>
        </div>
      )}
    </div>
  );
}
