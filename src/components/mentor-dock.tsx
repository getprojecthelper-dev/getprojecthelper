/**
 * Floating AI Mentor launcher available on every project page.
 */

import { X } from "lucide-react";
import { useState } from "react";

import mentorMark from "@/assets/mentor-mark.png";
import { MentorChat } from "@/components/mentor-chat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MentorDock({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open ? (
        <div
          className={cn(
            "fixed bottom-24 right-5 z-50 flex h-[min(34rem,70vh)] w-[min(26rem,calc(100vw-2.5rem))] flex-col",
            "overflow-hidden rounded-2xl border border-border bg-card shadow-2xl",
          )}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
            <img src={mentorMark} alt="" loading="lazy" width={512} height={512} className="h-6 w-6" />
            <p className="flex-1 font-display text-sm">AI Mentor</p>
            <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close mentor">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <MentorChat projectId={projectId} className="px-1" />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Hide AI Mentor" : "Ask the AI Mentor"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-card shadow-xl transition-transform hover:scale-105"
      >
        <img src={mentorMark} alt="" loading="lazy" width={512} height={512} className="h-8 w-8" />
      </button>
    </>
  );
}
