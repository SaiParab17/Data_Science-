// DataWatch — Left Sidebar Navigation
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Database, Upload, Bell, GitBranch,
  History, FileText, Settings, Plus, Activity
} from "lucide-react";
import { useDriftStore } from "../../store/driftStore";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Datasets", icon: Database, path: "/datasets" },
  { label: "Pipelines", icon: GitBranch, path: "/pipelines" },
  { label: "Alerts", icon: Bell, path: "/alerts", badge: true },
  { label: "History", icon: History, path: "/history" },
  { label: "Reports", icon: FileText, path: "/reports" },
];

const NAV_SECONDARY = [
  { label: "Settings", icon: Settings, path: "/settings" },
  { label: "Upload", icon: Upload, path: "/upload" },
];

export function Sidebar() {
  const { result } = useDriftStore();
  const alertCount = result?.alerts.length ?? 0;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[220px] bg-surface-container-low border-r border-outline-variant/25 flex flex-col z-40 py-space-md overflow-y-auto"
      style={{ boxShadow: "inset -1px 0 2px rgba(40,36,30,0.04)" }}>

      {/* Add Dataset CTA */}
      <div className="px-space-sm pb-space-md">
        <NavLink to="/upload" className="btn-primary w-full justify-center py-space-sm text-sm gap-space-xs font-semibold">
          <Plus size={16} />
          Add Dataset
        </NavLink>
      </div>

      {/* Divider */}
      <div className="mx-space-sm mb-space-sm border-t border-outline-variant/25" />

      {/* Primary navigation */}
      <nav className="flex-1 px-space-xs flex flex-col gap-space-2xs">
        <div className="mb-space-xs">
          <span className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider px-space-sm">Monitor</span>
        </div>

        {NAV_ITEMS.map(({ label, icon: Icon, path, badge }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `nav-item gap-space-sm text-sm ${isActive ? "active" : ""}`
            }
          >
            <div className="flex items-center gap-space-sm">
              <Icon size={16} />
              <span>{label}</span>
            </div>
            {badge && alertCount > 0 && (
              <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded-full bg-error-container text-on-error-container">
                {alertCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-space-sm my-space-sm border-t border-outline-variant/25" />

      {/* Secondary navigation */}
      <nav className="px-space-xs flex flex-col gap-space-2xs">
        <div className="mb-space-xs">
          <span className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider px-space-sm">Configure</span>
        </div>
        {NAV_SECONDARY.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `nav-item gap-space-sm text-sm ${isActive ? "active" : ""}`
            }
          >
            <div className="flex items-center gap-space-sm">
              <Icon size={16} />
              <span>{label}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Engine Telemetry */}
      <div className="mx-space-xs mt-space-md">
        <div className="card px-space-sm py-space-sm">
          <div className="flex items-center gap-space-xs mb-space-xs">
            <Activity size={12} className="text-tertiary" />
            <span className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">Engine Status</span>
          </div>
          <div className="flex flex-col gap-space-2xs">
            <div className="flex justify-between items-center">
              <span className="font-mono text-tech-sm text-on-surface-variant">Monitored</span>
              <span className="font-mono text-tech-val text-on-surface font-semibold">6 datasets</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-tech-sm text-on-surface-variant">Pipelines</span>
              <span className="font-mono text-tech-val text-on-surface font-semibold">6 active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-tech-sm text-on-surface-variant">Last sync</span>
              <span className="font-mono text-tech-sm text-on-surface-variant">14:42 UTC</span>
            </div>
            <div className="h-0.5 rounded-full mt-space-xs overflow-hidden bg-surface-container-highest">
              <div className="h-full rounded-full bg-tertiary" style={{ width: "87%" }} />
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-label-sm text-on-surface-variant">Platform Health</span>
              <span className="font-mono text-label-sm text-tertiary font-bold">87%</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
