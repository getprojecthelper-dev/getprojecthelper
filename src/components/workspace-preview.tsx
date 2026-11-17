import {
  ArrowRight,
  Compass,
  FileText,
  LockKeyhole,
  Plus,
  Settings2,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Dashboard", icon: Compass },
  { label: "Credits", icon: WalletCards },
  { label: "Settings", icon: Settings2 },
];

const toolItems = [
  { label: "Documentation", icon: FileText },
  { label: "Viva practice", icon: UsersRound },
  { label: "Project support", icon: Compass },
];

const demoSteps = [...navItems, ...toolItems].map((item) => item.label);

const previewPanels: Record<
  string,
  {
    heading: string;
    description: string;
    primaryTitle: string;
    primaryCopy: string;
    secondaryTitle: string;
    secondaryCopy: string;
  }
> = {
  Dashboard: {
    heading: "Good to see you, there.",
    description: "Pick up where you left off, or start something new.",
    primaryTitle: "Turn your idea into a project",
    primaryCopy: "Start with your idea and build it step by step.",
    secondaryTitle: "Buy projects",
    secondaryCopy: "Guided projects aren’t open yet.",
  },
  Credits: {
    heading: "Your AI credits, at a glance.",
    description: "Keep track of the balance powering your project work.",
    primaryTitle: "Manage AI credits",
    primaryCopy: "View your balance, usage, and redemption options.",
    secondaryTitle: "More ways to create",
    secondaryCopy: "Plans and credit packs are available when you need them.",
  },
  Settings: {
    heading: "Make the workspace yours.",
    description: "Control your profile and workspace preferences in one place.",
    primaryTitle: "Workspace settings",
    primaryCopy: "Update the preferences that shape your experience.",
    secondaryTitle: "Account details",
    secondaryCopy: "Keep your profile and access details up to date.",
  },
  Documentation: {
    heading: "Write with a clear plan.",
    description: "Create polished project documents with your work as the source.",
    primaryTitle: "Project documentation",
    primaryCopy: "Turn your project work into structured writing.",
    secondaryTitle: "Ready when you are",
    secondaryCopy: "Choose a project to start creating documents.",
  },
  "Viva practice": {
    heading: "Practise with confidence.",
    description: "Prepare for project questions with focused viva practice.",
    primaryTitle: "Viva practice",
    primaryCopy: "Build confidence with questions tailored to your project.",
    secondaryTitle: "Your project, explained",
    secondaryCopy: "Select a project and rehearse your answers.",
  },
  "Project support": {
    heading: "Get support when you need it.",
    description: "Keep moving forward with help that understands your project.",
    primaryTitle: "Project support",
    primaryCopy: "Find focused guidance for the next step in your work.",
    secondaryTitle: "Keep your momentum",
    secondaryCopy: "Choose a project to get relevant support.",
  },
};

/** Interactive preview of the welcome workspace shown on the landing page. */
export function WorkspacePreview() {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [isPaused, setIsPaused] = useState(false);
  const panel = previewPanels[activeItem] ?? previewPanels["Dashboard"]!;

  useEffect(() => {
    if (isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveItem((current) => {
        const index = demoSteps.indexOf(current);
        return demoSteps[(index + 1) % demoSteps.length] ?? "Dashboard";
      });
    }, 3500);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const selectItem = (item: string) => {
    setActiveItem(item);
    setIsPaused(true);
  };

  return (
    <div className="relative min-w-0">
      <div className="pointer-events-none absolute inset-0 scale-[1.04] rounded-2xl bg-hero-ink/5 blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#f8fbff] text-slate-900 shadow-[0_30px_80px_-42px_rgba(15,23,42,.42)]">
        <div className="grid min-h-[25rem] grid-cols-[10rem_minmax(0,1fr)] sm:grid-cols-[13rem_minmax(0,1fr)]">
          <aside className="border-r border-slate-800 bg-[#0b1736] px-3 py-5 sm:px-4">
            <PreviewGroup
              label="Workspace"
              items={navItems}
              activeItem={activeItem}
              onSelect={selectItem}
            />
            <div className="my-5 border-t border-slate-700" />
            <PreviewGroup
              label="Project tools"
              items={toolItems}
              activeItem={activeItem}
              onSelect={selectItem}
              blue
            />
          </aside>

          <div className="min-w-0 p-5 sm:p-8">
            <p className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.15em] text-blue-600 sm:text-[10px]">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Your project space
            </p>
            <div
              key={activeItem}
              className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
            >
              <h3 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-[.94] tracking-[-0.065em] text-slate-950 sm:text-5xl">
                {panel.heading}
              </h3>
              <p className="mt-3 text-[10px] text-slate-600 sm:text-sm">{panel.description}</p>
              <div className="mt-6 grid grid-cols-2 gap-2 border-t border-slate-200 pt-6 sm:gap-4">
                <PreviewCard title={panel.primaryTitle} description={panel.primaryCopy} primary />
                <PreviewCard title={panel.secondaryTitle} description={panel.secondaryCopy} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-[9px] text-slate-500 sm:text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Live workspace demo
              </span>
              <button
                type="button"
                onClick={() => setIsPaused((paused) => !paused)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {isPaused ? <Play className="size-3" /> : <Pause className="size-3" />}
                {isPaused ? "Play demo" : "Pause demo"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewGroup({
  label,
  items,
  activeItem,
  onSelect,
  blue = false,
}: {
  label: string;
  items: { label: string; icon: typeof Compass }[];
  activeItem: string;
  onSelect: (item: string) => void;
  blue?: boolean;
}) {
  return (
    <div>
      <p className="mb-3 text-[8px] font-bold uppercase tracking-[0.16em] text-blue-200">{label}</p>
      <div className="space-y-1 text-[10px] text-slate-200 sm:text-xs">
        {items.map(({ label: itemLabel, icon: Icon }) => (
          <button
            key={itemLabel}
            type="button"
            aria-pressed={activeItem === itemLabel}
            onClick={() => onSelect(itemLabel)}
            className={`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
              activeItem === itemLabel
                ? "border border-white/15 bg-white/10 font-semibold text-white shadow-sm"
                : "text-slate-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className={blue ? "size-3 text-blue-300" : "size-3"} />
            <span className="truncate">{itemLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  description,
  primary = false,
}: {
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <div
      className={`flex min-h-36 flex-col rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:min-h-44 sm:p-5 ${
        primary
          ? "border-blue-500 bg-[linear-gradient(135deg,#1268e8_0%,#0757c7_100%)] text-white shadow-[0_16px_28px_-18px_rgba(8,102,232,.85)]"
          : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex size-6 items-center justify-center rounded-lg sm:size-8 ${
            primary ? "bg-white/15 text-white shadow-sm" : "bg-blue-50 text-blue-600"
          }`}
        >
          {primary ? (
            <Plus className="size-3.5 sm:size-4" />
          ) : (
            <LockKeyhole className="size-3.5 sm:size-4" />
          )}
        </span>
        {!primary ? (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[6px] font-semibold uppercase text-slate-500 sm:text-[8px]">
            Launching soon
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-sm font-semibold tracking-[-0.035em] sm:text-lg">
        {title}
      </p>
      <p
        className={`mt-1 hidden text-[10px] sm:block ${primary ? "text-blue-100" : "text-slate-500"}`}
      >
        {description}
      </p>
      {primary ? (
        <Link
          to="/new-project"
          className="mt-auto flex items-center gap-1 text-[9px] font-semibold text-white hover:underline sm:text-xs"
        >
          Start building <ArrowRight className="size-3" />
        </Link>
      ) : (
        <span className="mt-auto text-[9px] font-semibold text-slate-500 sm:text-xs">
          Launching soon
        </span>
      )}
    </div>
  );
}
