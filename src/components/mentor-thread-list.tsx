/**
 * Saved AI Mentor conversations for a project: start a new chat or reopen
 * an older one. Each conversation has its own URL.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  createMentorThread,
  deleteMentorThread,
  listMentorThreads,
  type MentorThread,
} from "@/lib/mentor.functions";
import { cn } from "@/lib/utils";

export const mentorThreadsKey = (projectId: string) => ["mentor-threads", projectId] as const;

export function useMentorThreads(projectId: string) {
  const list = useServerFn(listMentorThreads);
  return useQuery({
    queryKey: mentorThreadsKey(projectId),
    queryFn: (): Promise<MentorThread[]> => list({ data: { projectId } }),
  });
}

export function MentorThreadList({
  projectId,
  className,
}: {
  projectId: string;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const threads = useMentorThreads(projectId);
  const create = useServerFn(createMentorThread);
  const remove = useServerFn(deleteMentorThread);

  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;

  const newChat = useMutation({
    mutationFn: () => create({ data: { projectId } }),
    onSuccess: async (thread) => {
      await queryClient.invalidateQueries({ queryKey: mentorThreadsKey(projectId) });
      void navigate({
        to: "/projects/$projectId/mentor/$threadId",
        params: { projectId, threadId: thread.id },
      });
    },
    onError: () => toast.error("We couldn't start a new conversation."),
  });

  const drop = useMutation({
    mutationFn: (threadId: string) => remove({ data: { threadId } }),
    onSuccess: async (_result, threadId) => {
      await queryClient.invalidateQueries({ queryKey: mentorThreadsKey(projectId) });
      toast.success("Conversation deleted.");
      if (threadId === activeId) {
        void navigate({ to: "/projects/$projectId/mentor", params: { projectId } });
      }
    },
    onError: () => toast.error("We couldn't delete that conversation."),
  });

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col rounded-2xl border border-border bg-card/60 p-3",
        className,
      )}
    >
      <Button
        size="sm"
        className="mb-3 w-full"
        onClick={() => newChat.mutate()}
        disabled={newChat.isPending}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        New chat
      </Button>

      <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Conversation history
      </p>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 pr-2">
          {(threads.data ?? []).map((thread) => (
            <div
              key={thread.id}
              className={cn(
                "flex items-center gap-1 rounded-lg px-1",
                thread.id === activeId && "bg-accent",
              )}
            >
              <Link
                to="/projects/$projectId/mentor/$threadId"
                params={{ projectId, threadId: thread.id }}
                className="flex min-w-0 flex-1 items-center gap-2 py-2 text-sm"
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{thread.title}</span>
              </Link>
              <button
                type="button"
                aria-label={`Delete ${thread.title}`}
                onClick={() => drop.mutate(thread.id)}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {threads.data && threads.data.length === 0 ? (
            <p className="px-1 py-4 text-xs text-muted-foreground">
              No saved conversations yet.
            </p>
          ) : null}
        </div>
      </ScrollArea>
    </aside>
  );
}
