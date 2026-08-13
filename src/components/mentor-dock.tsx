/**
 * Floating AI Mentor launcher available on every project page.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import mentorMark from "@/assets/mentor-mark.png";
import { MentorChat } from "@/components/mentor-chat";
import { mentorThreadsKey, useMentorThreads } from "@/components/mentor-thread-list";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createMentorThread } from "@/lib/mentor.functions";
import { cn } from "@/lib/utils";

export function MentorDock({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const threads = useMentorThreads(projectId);
  const create = useServerFn(createMentorThread);

  // The dock continues the most recent saved conversation, creating one the
  // first time the student opens it.
  const start = useMutation({
    mutationFn: () => create({ data: { projectId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mentorThreadsKey(projectId) }),
  });

  const threadId = threads.data?.[0]?.id ?? null;

  useEffect(() => {
    if (!open || threads.isLoading || threadId || start.isPending || start.isSuccess) return;
    start.mutate();
  }, [open, threads.isLoading, threadId, start]);

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
          {threadId ? (
            <MentorChat key={threadId} projectId={projectId} threadId={threadId} className="px-1" />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
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
