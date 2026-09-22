// DataWatch — Metric Card (Tactile Raised Card from Stitch design)
import React from "react";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  subLabel?: string;
  variant?: "default" | "warning" | "critical" | "success";
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const VARIANT_VALUE_COLORS: Record<string, string> = {
  default: "text-on-surface",
  warning: "text-secondary",
  critical: "text-error",
  success: "text-tertiary",
};

export function MetricCard({
  label,
  value,
  subValue,
  subLabel,
  variant = "default",
  children,
  className = "",
  onClick,
}: MetricCardProps) {
  const valueColor = VARIANT_VALUE_COLORS[variant];

  return (
    <div
      className={`card-raised p-space-md flex flex-col justify-between ${onClick ? "cursor-pointer hover:brightness-95 transition-all" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
        {subLabel && (
          <span
            className={`font-mono text-tech-sm font-semibold ${
              variant === "warning"
                ? "text-secondary bg-secondary-fixed/40 px-space-xs py-space-2xs rounded-lg"
                : variant === "critical"
                ? "text-error bg-error-container px-space-xs py-space-2xs rounded-lg"
                : "text-on-surface-variant"
            }`}
          >
            {subLabel}
          </span>
        )}
      </div>

      <div className={`my-space-sm font-mono text-tech-display tracking-tight leading-none ${valueColor}`}>
        {value}
      </div>

      {subValue && (
        <div className={`font-mono text-tech-sm mt-space-2xs ${VARIANT_VALUE_COLORS[variant]}`}>
          {subValue}
        </div>
      )}

      {children}
    </div>
  );
}
