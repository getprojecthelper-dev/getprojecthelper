import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { MentorThreadList } from "@/components/mentor-thread-list";
import { useSidebar } from "@/components/ui/sidebar";

const MIN_HISTORY_WIDTH = 200;
const MAX_HISTORY_WIDTH = 520;
const DEFAULT_HISTORY_WIDTH = 288;
const STORAGE_KEY = "mentor-history-width";

export const Route = createFileRoute("/_authenticated/projects/$projectId/mentor")({
  head: () => ({
    meta: [
      { title: "AI Mentor — Project Helper" },
      {
        name: "description",
        content:
          "Talk to a project-aware AI mentor that reads your plan, requirements and test results and challenges weak reasoning.",
      },
      { property: "og:title", content: "AI Mentor — Project Helper" },
      {
        property: "og:description",
        content: "A senior project mentor that answers from your real project data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MentorLayout,
});

function useResizableHistoryWidth() {
  const [width, setWidth] = useState(DEFAULT_HISTORY_WIDTH);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = Number.parseInt(localStorage.getItem(STORAGE_KEY) || "", 10);
    if (!Number.isNaN(saved)) {
      setWidth(Math.min(MAX_HISTORY_WIDTH, Math.max(MIN_HISTORY_WIDTH, saved)));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const next = Math.min(MAX_HISTORY_WIDTH, Math.max(MIN_HISTORY_WIDTH, startWidthRef.current + delta));
      setWidth(next);
    };

    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(width));
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [width]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return { width, startResize };
}

function MentorLayout() {
  const { projectId } = useParams({ from: "/_authenticated/projects/$projectId/mentor" });
  const { setOpen } = useSidebar();
  const { width, startResize } = useResizableHistoryWidth();

  // The mentor gets the full width: collapse the workspace sidebar while here.
  useEffect(() => {
    setOpen(false);
    return () => setOpen(true);
  }, [setOpen]);

  return (
    <section className="flex h-[calc(100vh-4rem)] min-h-0 w-full flex-col overflow-hidden md:flex-row">
      {/* Desktop conversation history — resizable so users can choose how much room it takes. */}
      <div
        className="relative hidden shrink-0 border-r border-border/60 bg-card/30 md:block"
        style={{ width }}
      >
        <MentorThreadList
          projectId={projectId}
          className="h-full w-full rounded-none border-0 bg-transparent p-3"
        />
        <button
          type="button"
          aria-label="Resize conversation history"
          onMouseDown={startResize}
          className="absolute inset-y-0 right-0 z-10 w-1.5 translate-x-1/2 cursor-col-resize bg-transparent transition-colors hover:bg-primary/40 active:bg-primary/60"
        />
      </div>
      {/* Mobile conversation history — compact horizontal strip. */}
      <MentorThreadList
        projectId={projectId}
        className="max-h-44 shrink-0 rounded-none border-0 border-b border-border/60 bg-transparent md:hidden"
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </section>
  );
}
