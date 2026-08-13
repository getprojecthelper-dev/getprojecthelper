/**
 * AI Mentor chat — one ongoing conversation per project, persisted in the
 * backend and grounded in the project's real plan, requirements and results.
 */

import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Check, Eraser, FolderInput, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import mentorMark from "@/assets/mentor-mark.png";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { creditMeter } from "@/components/credit-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjects } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { clearMentorChat, getMentorHistory, type MentorMessage } from "@/lib/mentor.functions";
import { cn } from "@/lib/utils";

const STARTERS = [
  "What should I work on next?",
  "Review my requirements and tell me what's weak",
  "Are my test results actually convincing?",
  "Ask me three viva questions about this project",
];

function toUIMessages(rows: MentorMessage[]): UIMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    parts: [{ type: "text" as const, text: row.content }],
  }));
}

export function MentorChat({
  projectId,
  className,
  fresh = false,
}: {
  projectId: string;
  className?: string;
  /** Fresh session: start with an empty view and don't save this conversation. */
  fresh?: boolean;
}) {
  const queryClient = useQueryClient();
  const fetchHistory = useServerFn(getMentorHistory);
  const clearChat = useServerFn(clearMentorChat);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const projects = useProjects();

  const history = useQuery({
    queryKey: ["mentor-history", projectId],
    queryFn: () => fetchHistory({ data: { projectId } }),
    staleTime: 60_000,
    enabled: !fresh,
  });

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { projectId, importedProjectIds: importedIds, persist: !fresh },
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [projectId, importedIds, fresh],
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: fresh ? `${projectId}:fresh` : projectId,
    transport,
    onError: (error) => {
      creditMeter.cancel();
      toast.error(error.message || "The mentor could not answer right now.");
    },
    onFinish: () => {
      creditMeter.finish();
      void queryClient.invalidateQueries({ queryKey: ["credits"] });
      void queryClient.invalidateQueries({ queryKey: ["mentor-history", projectId] });
    },
  });

  // Seed the conversation from saved history once it arrives.
  const seeded = useRef<string | null>(null);
  useEffect(() => {
    if (fresh || !history.data || seeded.current === projectId) return;
    seeded.current = projectId;
    if (history.data.length) setMessages(toUIMessages(history.data));
  }, [fresh, history.data, projectId, setMessages]);

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, projectId]);

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    creditMeter.start("mentor_chat");
    void sendMessage({ text: trimmed });
  };

  const reset = useMutation({
    mutationFn: async () => {
      if (fresh) return;
      await clearChat({ data: { projectId } });
    },
    onSuccess: () => {
      setMessages([]);
      void queryClient.invalidateQueries({ queryKey: ["mentor-history", projectId] });
      toast.success("Conversation cleared.");
    },
    onError: () => toast.error("We couldn't clear the conversation."),
  });

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6">
          {messages.length === 0 ? (
            <ConversationEmptyState className="gap-5">
              <img
                src={mentorMark}
                alt="AI Mentor"
                loading="lazy"
                width={512}
                height={512}
                className="h-16 w-16"
              />
              <div className="space-y-1">
                <h3 className="font-display text-lg">Your project mentor</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  I can already see this project&apos;s plan, requirements, tests and results. Ask
                  me anything about it.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => ask(starter)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent
                  className={cn(
                    message.role === "user" &&
                      "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
                  )}
                >
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={index}>{part.text}</MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}

          {status === "submitted" ? (
            <Shimmer className="text-sm">Mentor is thinking…</Shimmer>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl shrink-0 px-1 pb-2">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <FolderInput className="mr-1.5 h-3.5 w-3.5" />
                Import project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import a project</DialogTitle>
                <DialogDescription>
                  Pick up to 3 projects you&apos;ve worked on. The mentor will read their plan,
                  requirements, tests and results so you can ask questions about them.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-80 pr-2">
                <div className="space-y-2">
                  {(projects.data ?? []).map((project) => {
                    const selected = importedIds.includes(project.id);
                    const full = importedIds.length >= 3 && !selected;
                    return (
                      <button
                        key={project.id}
                        type="button"
                        disabled={full}
                        onClick={() =>
                          setImportedIds((current) =>
                            selected
                              ? current.filter((id) => id !== project.id)
                              : [...current, project.id],
                          )
                        }
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/40",
                          selected && "border-primary/60 bg-primary/5",
                          full && "opacity-50",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{project.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {project.domain} · {project.current_stage}
                          </span>
                        </span>
                        {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                      </button>
                    );
                  })}
                  {projects.data && projects.data.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      You don&apos;t have any other projects yet.
                    </p>
                  ) : null}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {importedIds.map((id) => {
            const project = (projects.data ?? []).find((item) => item.id === id);
            return (
              <Badge key={id} variant="secondary" className="gap-1 text-xs">
                {project?.name ?? "Project"}
                <button
                  type="button"
                  aria-label={`Remove ${project?.name ?? "project"}`}
                  onClick={() => setImportedIds((current) => current.filter((x) => x !== id))}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}

          <span className="ml-auto" />
        </div>

        {messages.length > 0 ? (
          <div className="mb-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => reset.mutate()}
              disabled={reset.isPending || busy}
              className="text-xs text-muted-foreground"
            >
              <Eraser className="mr-1.5 h-3.5 w-3.5" />
              {fresh ? "Clear view" : "Clear conversation"}
            </Button>
          </div>
        ) : null}

        <PromptInput
          onSubmit={(message, event) => {
            event.preventDefault();
            const text = message.text ?? "";
            if (!text.trim()) return;
            ask(text);
            event.currentTarget.reset();
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            autoFocus
            placeholder="Ask your mentor about this project…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
