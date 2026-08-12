import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-success"
      : tone === "warn"
        ? "text-warning"
        : tone === "bad"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className={cn("mt-3 font-display text-3xl font-semibold", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function MeterBar({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "accent" | "warning" | "danger";
  className?: string;
}) {
  const bar =
    tone === "accent"
      ? "bg-accent"
      : tone === "warning"
        ? "bg-warning"
        : tone === "danger"
          ? "bg-destructive"
          : "bg-primary";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", bar)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function healthTone(score: number): "good" | "warn" | "bad" {
  return score >= 75 ? "good" : score >= 50 ? "warn" : "bad";
}
