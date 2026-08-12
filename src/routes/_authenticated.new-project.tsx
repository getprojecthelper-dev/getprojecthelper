import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProjectWithTemplate } from "@/lib/create-project";
import { ACADEMIC_LEVELS, DOMAINS, PURPOSES, TEMPLATES } from "@/lib/project-domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/new-project")({
  head: () => ({
    meta: [
      { title: "New project — Project Helper" },
      { name: "description", content: "Set up a new project and generate its lifecycle plan." },
      { property: "og:title", content: "New project — Project Helper" },
      { property: "og:description", content: "Set up a new project and generate its plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewProject,
});

const STEPS = ["What are you building?", "Domain & template", "Context", "Review"];

function NewProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    domain: "software",
    template: "software",
    project_type: "",
    academic_level: "undergraduate",
    purpose: "academic",
    deadline: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canContinue = step !== 0 || form.name.trim().length >= 3;

  const submit = async () => {
    const parsed = z
      .object({
        name: z.string().trim().min(3, "Give your project a name").max(120),
        description: z.string().trim().max(2000).optional(),
      })
      .safeParse({ name: form.name, description: form.description });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      setStep(0);
      return;
    }
    setBusy(true);
    try {
      const id = await createProjectWithTemplate({
        ...form,
        name: parsed.data.name,
        description: parsed.data.description || null,
        project_type: form.project_type || null,
        deadline: form.deadline || null,
      });
      toast.success("Project created with its starter plan.");
      void navigate({ to: "/projects/$projectId", params: { projectId: id } });
    } catch (error) {
      console.error(error);
      toast.error("We couldn't create the project. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
        </Button>

        <ol className="mb-6 flex flex-wrap gap-2 text-xs">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={cn(
                "rounded-full border px-3 py-1",
                i === step
                  ? "border-primary bg-primary/10 text-primary"
                  : i < step
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="mr-1 inline h-3 w-3" /> : null}
              {s}
            </li>
          ))}
        </ol>

        <div className="panel space-y-5 p-6">
          {step === 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Project name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Flight Delay Prediction"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective">Objective / description (optional)</Label>
                <Textarea
                  id="objective"
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="What problem does this project solve, and what does success look like?"
                />
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label>Domain</Label>
                <Select value={form.domain} onValueChange={(v) => set("domain", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <div className="grid gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("template", t.value)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        form.template === t.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/60",
                      )}
                    >
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.workflow.join(" → ")}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Select value={form.purpose} onValueChange={(v) => set("purpose", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PURPOSES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Academic level</Label>
                  <Select value={form.academic_level} onValueChange={(v) => set("academic_level", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Project type (optional)</Label>
                  <Input
                    id="type"
                    value={form.project_type}
                    onChange={(e) => set("project_type", e.target.value)}
                    placeholder="Final year project"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={form.deadline}
                    onChange={(e) => set("deadline", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Everything on this step is optional — you can skip it and fill it in later from
                project settings.
              </p>
            </>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3 text-sm">
              <Row label="Name" value={form.name} />
              <Row label="Domain" value={DOMAINS.find((d) => d.value === form.domain)?.label ?? ""} />
              <Row
                label="Template"
                value={TEMPLATES.find((t) => t.value === form.template)?.label ?? ""}
              />
              <Row label="Purpose" value={form.purpose} />
              <Row label="Deadline" value={form.deadline || "Not set"} />
              <p className="text-xs text-muted-foreground">
                Creating the project will seed its starter tasks and report structure from the
                template. You can edit or delete anything afterwards.
              </p>
            </div>
          ) : null}

          <div className="flex justify-between gap-2 border-t border-border pt-4">
            <Button
              variant="ghost"
              disabled={step === 0 || busy}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={busy} onClick={() => void submit()}>
                {busy ? "Creating…" : "Create project"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
