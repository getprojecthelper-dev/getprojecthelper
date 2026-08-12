/**
 * Live AI credit usage meter. An action reserves an estimate up-front, the bar
 * fills while the run is in flight, then settles on the real cost.
 */

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ACTION_LABELS, formatCredits } from "@/lib/credit-costs";
import { cn } from "@/lib/utils";

interface MeterState {
  active: boolean;
  label: string;
  estimate: number;
  spent: number;
  startedAt: number;
  finishedAt: number | null;
  /** Bumped whenever a run settles or fails, so listeners can refresh balances. */
  revision: number;
}

const initial: MeterState = {
  active: false,
  label: "",
  estimate: 0,
  spent: 0,
  startedAt: 0,
  finishedAt: null,
  revision: 0,
};


let state: MeterState = initial;
const listeners = new Set<() => void>();

function set(next: Partial<MeterState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const creditMeter = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
  start(action: string) {
    const meta = ACTION_LABELS[action] ?? { label: "Working", estimate: 3 };
    set({
      active: true,
      label: meta.label,
      estimate: meta.estimate,
      spent: 0,
      startedAt: Date.now(),
      finishedAt: null,
    });
  },
  finish(spent?: number) {
    set({
      active: false,
      spent: spent ?? state.estimate,
      finishedAt: Date.now(),
      revision: state.revision + 1,
    });
  },
  cancel() {
    set({ active: false, spent: 0, finishedAt: null, revision: state.revision + 1 });
  },

};

/** Wrap any AI server function so the meter runs while it is in flight. */
export function withMeter<A extends unknown[], R>(
  action: string,
  fn: (...args: A) => Promise<R>,
) {
  return async (...args: A): Promise<R> => {
    creditMeter.start(action);
    try {
      const result = await fn(...args);
      creditMeter.finish();
      return result;
    } catch (error) {
      creditMeter.cancel();
      throw error;
    }
  };
}

const useMeter = () =>
  useSyncExternalStore(creditMeter.subscribe, creditMeter.get, () => initial);

export function CreditMeter() {
  const meter = useMeter();
  const queryClient = useQueryClient();
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!meter.active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 120);
    return () => window.clearInterval(id);
  }, [meter.active]);

  useEffect(() => {
    if (meter.active || meter.finishedAt) setVisible(true);
    if (!meter.active && meter.finishedAt) {
      void queryClient.invalidateQueries({ queryKey: ["credits"] });
      const id = window.setTimeout(() => setVisible(false), 4000);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [meter.active, meter.finishedAt, queryClient]);

  if (!visible) return null;

  // Asymptotic fill: fast at first, never quite 100% until settled.
  const elapsed = (Date.now() - meter.startedAt) / 1000 + tick * 0;
  const progress = meter.active ? 1 - Math.exp(-elapsed / 14) : 1;
  const running = Number((meter.estimate * progress).toFixed(2));

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 w-[19rem] max-w-[calc(100vw-2.5rem)]">
      <div
        className={cn(
          "pointer-events-auto rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur",
          "animate-in fade-in slide-in-from-bottom-2",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium">
            {meter.active ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
            {meter.active ? meter.label : "Run complete"}
          </span>
          <span className="flex items-center gap-1 font-mono text-sm tabular-nums text-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {formatCredits(meter.active ? running : meter.spent)}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {meter.active
            ? `Reserved ${formatCredits(meter.estimate)} credits — unused credits are returned.`
            : `Charged ${formatCredits(meter.spent)} credits for this run.`}
        </p>
      </div>
    </div>
  );
}
