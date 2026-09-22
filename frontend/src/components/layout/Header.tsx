// DataWatch — Application Header
import { NavLink, useNavigate } from "react-router-dom";
import { Search, Bell, RefreshCw, ChevronDown } from "lucide-react";
import { useDriftStore } from "../../store/driftStore";

interface HeaderProps {
  variant?: "app" | "landing";
}

export function Header({ variant = "app" }: HeaderProps) {
  const { result } = useDriftStore();
  const navigate = useNavigate();
  const alertCount = result?.alerts.length ?? 0;

  if (variant === "landing") {
    return (
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-low/90 backdrop-blur-md"
        style={{ boxShadow: "0 1px 8px rgba(40,36,30,0.06)" }}>
        <div className="h-16 w-full px-margin flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-lg">
            <NavLink to="/" className="flex items-center gap-space-sm">
              <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center">
                <span className="text-on-primary text-sm font-bold font-mono">DW</span>
              </div>
              <div className="flex flex-col">
                <span className="font-space text-headline-sm text-on-surface font-bold tracking-tight">DATAWATCH</span>
                <span className="font-mono text-label-sm text-on-surface-variant uppercase">DATA PIPELINE OBSERVABILITY</span>
              </div>
            </NavLink>

            <nav className="hidden xl:flex items-center gap-space-xs">
              {["Dashboard", "Datasets", "Alerts", "Pipelines", "Reports"].map((item) => (
                <NavLink
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="px-space-sm py-space-xs font-inter text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg"
                >
                  {item}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-space-md">
            <NavLink
              to="/dashboard"
              className="btn-primary text-sm hidden sm:inline-flex"
            >
              Open Dashboard →
            </NavLink>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/30">
              <span className="font-mono text-tech-sm text-on-surface font-bold">EV</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // App header (with sidebar layout)
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-md z-50 flex items-center justify-between px-space-md"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      {/* Left: Logo + Workspace selector */}
      <div className="flex items-center gap-space-md">
        <NavLink to="/" className="flex items-center gap-space-xs">
          <div className="w-7 h-7 bg-primary-container rounded-lg flex items-center justify-center">
            <span className="text-on-primary text-xs font-bold font-mono">DW</span>
          </div>
          <span className="font-space text-headline-sm text-on-surface tracking-tight hidden md:block">DATAWATCH</span>
          <span className="font-mono text-label-sm bg-surface-container-highest text-on-surface-variant px-space-xs py-space-2xs rounded-lg uppercase tracking-wider hidden lg:block">
            v2.4 / OBSERVATORY
          </span>
        </NavLink>

        <div className="h-4 w-px bg-outline-variant/40 hidden md:block" />

        <button className="hidden md:flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-xs rounded-xl hover:bg-surface-container-high transition-colors">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
          <span className="font-mono text-tech-sm text-on-surface-variant">Workspace:</span>
          <span className="font-mono text-tech-val text-on-surface">Prod-ML-Inference / Customer Churn</span>
          <ChevronDown size={14} className="text-outline" />
        </button>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-space-lg hidden lg:block">
        <div className="flex items-center gap-space-xs bg-surface-container-highest/60 px-space-md py-space-xs rounded-xl text-outline focus-within:text-on-surface focus-within:bg-surface-container-lowest"
          style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.06)" }}>
          <Search size={16} className="text-outline flex-shrink-0" />
          <span className="font-mono text-tech-sm text-on-surface-variant flex-1">⌘K Quick search datasets, features...</span>
          <kbd className="font-mono text-tech-sm bg-surface-container-high text-on-surface-variant px-space-xs py-space-2xs rounded-lg">⌘K</kbd>
        </div>
      </div>

      {/* Right: Status + alerts + profile */}
      <div className="flex items-center gap-space-sm">
        {/* Run status */}
        <div className="hidden xl:flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-xs rounded-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span className="font-mono text-label-sm text-on-surface-variant uppercase">Run #1042 · Warning</span>
        </div>

        {/* Alerts badge */}
        <NavLink
          to="/alerts"
          className={`flex items-center gap-space-xs px-space-sm py-space-xs rounded-xl transition-colors ${
            alertCount > 0
              ? "bg-secondary-fixed/50 text-on-secondary-fixed hover:bg-secondary-fixed"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          <Bell size={16} className={alertCount > 0 ? "text-secondary" : ""} />
          <span className="font-mono text-label-sm">
            {alertCount > 0 ? `${alertCount} Alert${alertCount !== 1 ? "s" : ""}` : "Alerts"}
          </span>
        </NavLink>

        {/* Refresh */}
        <button
          className="btn-ghost p-space-xs rounded-xl hidden md:flex"
          title="Refresh sync"
          onClick={() => navigate(0)}
        >
          <RefreshCw size={16} />
        </button>

        {/* Profile avatar */}
        <div className="flex items-center gap-space-xs pl-space-xs">
          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/30">
            <span className="font-mono text-tech-sm text-on-surface font-bold">EV</span>
          </div>
          <div className="hidden 2xl:flex flex-col text-left">
            <span className="font-inter text-label-md text-on-surface leading-none">Elena Vance</span>
            <span className="font-mono text-tech-sm text-on-surface-variant leading-none mt-space-2xs">Staff ML Engineer</span>
          </div>
        </div>
      </div>
    </header>
  );
}
