import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-transparent",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/18 text-warning-foreground border-warning/40",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
  info: "bg-info/12 text-info border-info/25",
  accent: "bg-accent/12 text-accent border-accent/25",
};

const TONES: Record<string, Tone> = {
  // task / requirement / doc / test statuses
  not_started: "neutral",
  draft: "neutral",
  not_run: "neutral",
  in_progress: "info",
  approved: "info",
  blocked: "danger",
  failed: "danger",
  open: "warning",
  completed: "success",
  complete: "success",
  passed: "success",
  resolved: "success",
  // priorities & severities
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
  // review states
  attention: "warning",
  at_risk: "danger",
  empty: "neutral",
};

export function StatusBadge({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const tone = TONES[value] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
