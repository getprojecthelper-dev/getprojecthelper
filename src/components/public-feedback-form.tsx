import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitSupportRequest } from "@/lib/support.functions";

type RequestKind = "contact" | "issue" | "grievance";

const copy: Record<RequestKind, { title: string; intro: string; button: string }> = {
  contact: {
    title: "Send us a message",
    intro: "Tell us how we can help. Our support team will review your message.",
    button: "Send message",
  },
  issue: {
    title: "Report an issue",
    intro: "Describe what happened, what you expected, and any steps that help us reproduce it.",
    button: "Submit report",
  },
  grievance: {
    title: "Submit a grievance",
    intro: "Share your concern and the outcome you are seeking. We will review it carefully.",
    button: "Submit grievance",
  },
};

export function PublicFeedbackForm({ kind }: { kind: RequestKind }) {
  const submit = useServerFn(submitSupportRequest);
  const [isSending, setIsSending] = useState(false);
  const text = copy[kind];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setIsSending(true);
    try {
      await submit({
        data: {
          kind,
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          subject: String(form.get("subject") ?? ""),
          message: String(form.get("message") ?? ""),
          pageUrl: window.location.href,
        },
      });
      formEl.reset();
      toast.success("Thanks — your message has been sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your message could not be sent.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="public-feedback-form" aria-labelledby="feedback-form-title">
      <h2 id="feedback-form-title">{text.title}</h2>
      <p>{text.intro}</p>
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">Name<Input name="name" autoComplete="name" required maxLength={120} /></label>
          <label className="grid gap-1.5 text-sm font-medium">Email<Input name="email" type="email" autoComplete="email" required maxLength={320} /></label>
        </div>
        <label className="grid gap-1.5 text-sm font-medium">Subject<Input name="subject" required minLength={3} maxLength={180} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Message<Textarea name="message" required minLength={10} maxLength={5000} rows={6} /></label>
        <Button type="submit" className="w-full sm:w-auto" disabled={isSending}>{isSending ? "Sending…" : text.button}</Button>
      </form>
    </section>
  );
}
