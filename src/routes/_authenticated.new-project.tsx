import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Database,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { withMeter } from "@/components/credit-meter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createGuidedProject,
  findDatasets,
  isDataDomain,
  suggestProjects,
  type DatasetOption,
  type SuggestedProject,
} from "@/lib/builder.functions";
import { DOMAINS } from "@/lib/project-domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/new-project")({
  head: () => ({
    meta: [
      { title: "Start a project — Project Helper" },
      {
        name: "description",
        content:
          "Describe your idea, pick a domain, choose from suggested projects and datasets, then build it section by section.",
      },
      { property: "og:title", content: "Start a project — Project Helper" },
      {
        property: "og:description",
        content: "Guided project setup: idea, domain, suggestions, datasets and an implementation plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewProject,
});

const STEPS = ["Your idea", "Pick a project", "Dataset", "Finalise"];

function NewProject() {
  const navigate = useNavigate();
  const suggest = withMeter("suggest_projects", useServerFn(suggestProjects));
  const datasetSearch = withMeter("find_datasets", useServerFn(findDatasets));
  const create = withMeter("create_project", useServerFn(createGuidedProject));


  const [step, setStep] = useState(0);
  const [idea, setIdea] = useState("");
  const [domain, setDomain] = useState("data_science");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState<Record<number, SuggestedProject[]>>({});
  const [chosen, setChosen] = useState<SuggestedProject | null>(null);
  const [datasets, setDatasets] = useState<DatasetOption[] | null>(null);
  const [dataset, setDataset] = useState<DatasetOption | null>(null);
  const [busy, setBusy] = useState(false);

  const needsDataset = isDataDomain(domain);
  const seen = Object.values(pages).flat().map((p) => p.title);

  const loadPage = async (target: number) => {
    if (pages[target]) {
      setPage(target);
      return;
    }
    setBusy(true);
    try {
      const projects = await suggest({ data: { idea, domain, page: target, exclude: seen } });
      setPages((p) => ({ ...p, [target]: projects }));
      setPage(target);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't load suggestions.");
    } finally {
      setBusy(false);
    }
  };

  const startSuggestions = async () => {
    if (idea.trim().length < 3) {
      toast.error("Tell us a little about the project you want to build.");
      return;
    }
    setStep(1);
    await loadPage(1);
  };

  const pickProject = async (project: SuggestedProject) => {
    setChosen(project);
    if (!needsDataset) {
      setStep(3);
      return;
    }
    setStep(2);
    setDatasets(null);
    setBusy(true);
    try {
      const found = await datasetSearch({
        data: { title: project.title, description: project.description, domain },
      });
      setDatasets(found);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't find datasets.");
      setDatasets([]);
    } finally {
      setBusy(false);
    }
  };

  const finalise = async () => {
    if (!chosen) return;
    setBusy(true);
    try {
      const { projectId } = await create({
        data: {
          idea,
          domain,
          title: chosen.title,
          description: chosen.description,
          techStack: chosen.tech_stack,
          dataset: needsDataset ? dataset : null,
        },
      });
      toast.success("Project created with its implementation plan.");
      void navigate({ to: "/projects/$projectId/build", params: { projectId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't create the project.");
    } finally {
      setBusy(false);
    }
  };

  const visibleSteps = needsDataset ? STEPS : STEPS.filter((s) => s !== "Dataset");

  return (
    <div className="min-h-screen bg-secondary/30 px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
        </Button>

        <ol className="mb-6 flex flex-wrap gap-2 text-xs">
          {visibleSteps.map((s) => {
            const index = STEPS.indexOf(s);
            return (
              <li
                key={s}
                className={cn(
                  "rounded-full border px-3 py-1",
                  index === step
                    ? "border-primary bg-primary/10 text-primary"
                    : index < step
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-border text-muted-foreground",
                )}
              >
                {index < step ? <Check className="mr-1 inline h-3 w-3" /> : null}
                {s}
              </li>
            );
          })}
        </ol>

        {step === 0 ? (
          <div className="panel space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="idea">Enter the project idea you want to build</Label>
              <Textarea
                id="idea"
                rows={4}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g. Something that predicts flight delays from historical data"
              />
            </div>
            <div className="space-y-2">
              <Label>Which domain does it belong to?</Label>
              <Select value={domain} onValueChange={setDomain}>
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
              <p className="text-xs text-muted-foreground">
                {needsDataset
                  ? "Data domains include a dataset selection step."
                  : "This domain skips datasets and goes straight to implementation."}
              </p>
            </div>
            <div className="flex justify-end border-t border-border pt-4">
              <Button disabled={busy} onClick={() => void startSuggestions()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Suggest projects
              </Button>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Suggested projects — page {page}. Not a fit? Load the next set.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || page === 1}
                  onClick={() => void loadPage(page - 1)}
                >
                  Previous
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void loadPage(page + 1)}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Next 4
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(pages[page] ?? []).map((project) => (
                <div key={project.title} className="panel flex flex-col gap-3 p-5">
                  <div>
                    <h2 className="font-display text-lg">{project.title}</h2>
                    <p className="text-xs text-muted-foreground">{project.difficulty}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <Button className="mt-auto" onClick={() => void pickProject(project)} disabled={busy}>
                    Create this project <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {busy && !pages[page] ? (
                <div className="panel flex items-center gap-2 p-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Finding projects for your idea…
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 2 && chosen ? (
          <div className="space-y-4">
            <div className="panel p-5">
              <h2 className="flex items-center gap-2 font-display text-lg">
                <Database className="h-4 w-4 text-primary" /> Select a dataset for {chosen.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                Sourced from public dataset repositories. Choose the one you'll work with.
              </p>
            </div>

            {busy ? (
              <div className="panel flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching for relevant datasets…
              </div>
            ) : null}

            {(datasets ?? []).map((d) => (
              <button
                key={d.url + d.name}
                type="button"
                onClick={() => setDataset(d)}
                className={cn(
                  "panel w-full space-y-3 p-5 text-left transition-colors",
                  dataset?.name === d.name ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium">{d.name}</h3>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs text-primary underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open source
                  </a>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded border border-border px-2 py-0.5">{d.source}</span>
                  <span className="rounded border border-border px-2 py-0.5">{d.size}</span>
                  <span className="rounded border border-border px-2 py-0.5">{d.format}</span>
                </div>
                <div className="grid gap-2 text-xs md:grid-cols-3">
                  <p className="rounded-md bg-success/10 p-2 text-success">Good for: {d.good_for}</p>
                  <p className="rounded-md bg-destructive/10 p-2 text-destructive">Bad for: {d.bad_for}</p>
                  <p className="rounded-md bg-warning/10 p-2">Common mistake: {d.common_mistakes}</p>
                </div>
              </button>
            ))}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back to suggestions
              </Button>
              <Button disabled={!dataset} onClick={() => setStep(3)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 && chosen ? (
          <div className="panel space-y-4 p-6">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <Target className="h-4 w-4 text-primary" /> Finalise your project
            </h2>
            <Row label="Title" value={chosen.title} />
            <Row label="Description" value={chosen.description} />
            <Row label="Tech stack" value={chosen.tech_stack.join(", ")} />
            <Row label="Domain" value={DOMAINS.find((d) => d.value === domain)?.label ?? domain} />
            {needsDataset ? <Row label="Dataset" value={dataset?.name ?? "Not selected"} /> : null}
            <p className="text-xs text-muted-foreground">
              Creating the project builds a 7–8 section implementation plan for this domain. Each
              section stays locked until you choose to generate it.
            </p>
            <div className="flex justify-between border-t border-border pt-4">
              <Button variant="ghost" onClick={() => setStep(needsDataset ? 2 : 1)} disabled={busy}>
                Back
              </Button>
              <Button onClick={() => void finalise()} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Creating…" : "Create project"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-2 text-sm sm:flex-row sm:justify-between sm:gap-6">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium sm:max-w-[70%] sm:text-right">{value || "—"}</span>
    </div>
  );
}
