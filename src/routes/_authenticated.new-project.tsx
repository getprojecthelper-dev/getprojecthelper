import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BookOpen,
  Check,
  Database,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
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
  findResearchPapers,
  isDataDomain,
  suggestProjects,
  type DatasetOption,
  type ResearchPaper,
  type SuggestedProject,
} from "@/lib/builder.functions";
import { domainBuildsCode } from "@/lib/domain-playbooks";
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
        content:
          "Guided project setup: idea, domain, suggestions, datasets and an implementation plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewProject,
});

const STEPS = ["Your idea", "Pick a project", "Research papers", "Dataset", "Finalise"];

const DIFFICULTIES = [
  { value: "easy", label: "Easy", detail: "A guided first build", level: 1 },
  { value: "intermediate", label: "Intermediate", detail: "A balanced challenge", level: 2 },
  { value: "hard", label: "Hard", detail: "A deeper technical build", level: 3 },
] as const;

type Difficulty = (typeof DIFFICULTIES)[number]["value"];
type CodeComplexity = "easy" | "intermediate" | "advanced";

const CODE_LEVELS: {
  value: CodeComplexity;
  label: string;
  tagline: string;
  audience: string;
  detail: string;
}[] = [
  {
    value: "easy",
    label: "Essential Level",
    tagline: "Easy to Understand · Easy to Implement · Easy to Remember",
    audience: "For students & beginners",
    detail:
      "Straightforward, readable code with simple functions, familiar syntax and basic concepts. No advanced patterns or unnecessary abstraction — important steps are explained clearly so you can understand, implement and remember the code.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    tagline: "Simple to Understand · Professional Code",
    audience: "Balanced approach",
    detail:
      "Beginner-friendly readability combined with professional practices: modular, reusable, maintainable code with proper functions, error handling and clean structure. Advanced concepts appear only when they add real value — no excessive boilerplate.",
  },
  {
    value: "advanced",
    label: "Production Level",
    tagline: "Engineering Excellence · Efficient · Maintainable",
    audience: "For experienced developers",
    detail:
      "Complete, robust, real-world solutions with appropriate architecture, validation, error handling, security and meaningful comments. Optimised where it matters — but a simple problem still gets a simple, efficient solution, never artificial length.",
  },
];

const difficultyTone = (value: string) => {
  const key = value.toLowerCase();
  if (key.includes("easy") || key.includes("beginner"))
    return "border-success/30 bg-success/10 text-success";
  if (key.includes("hard") || key.includes("advanced"))
    return "border-destructive/30 bg-destructive/10 text-destructive";
  return "border-info/30 bg-info/10 text-info";
};

const marketLabel = (score: number) =>
  score >= 80 ? "High demand" : score >= 60 ? "Solid demand" : "Niche demand";

const marketTone = (score: number) =>
  score >= 80
    ? "border-success/30 bg-success/10 text-success"
    : score >= 60
      ? "border-warning/30 bg-warning/10 text-warning"
      : "border-border bg-muted/50 text-muted-foreground";

const marketBar = (score: number) =>
  score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-muted-foreground/50";

function NewProject() {
  const navigate = useNavigate();
  const suggest = withMeter("suggest_projects", useServerFn(suggestProjects));
  const datasetSearch = withMeter("find_datasets", useServerFn(findDatasets));
  const paperSearch = withMeter("find_papers", useServerFn(findResearchPapers));
  const create = withMeter("create_project", useServerFn(createGuidedProject));

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"idea" | "suggest" | "job">("idea");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [idea, setIdea] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [domain, setDomain] = useState("data_science");
  const [codeComplexity, setCodeComplexity] = useState<CodeComplexity>("intermediate");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState<Record<number, SuggestedProject[]>>({});
  const [chosen, setChosen] = useState<SuggestedProject | null>(null);
  const [papers, setPapers] = useState<ResearchPaper[] | null>(null);
  const [selectedPapers, setSelectedPapers] = useState<ResearchPaper[]>([]);
  const [paperPage, setPaperPage] = useState(0);

  const [datasets, setDatasets] = useState<DatasetOption[] | null>(null);
  const [dataset, setDataset] = useState<DatasetOption | null>(null);
  const [busy, setBusy] = useState(false);

  const needsDataset = isDataDomain(domain);
  const seen = Object.values(pages)
    .flat()
    .map((p) => p.title);

  const loadPage = async (target: number, force = false) => {
    if (!force && pages[target]) {
      setPage(target);
      return;
    }
    setBusy(true);
    try {
      const projects = await suggest({
        data: {
          idea: mode === "idea" ? idea : "",
          jobDescription: mode === "job" ? jobDescription.trim().slice(0, 6000) : "",
          domain,
          page: target,
          exclude: seen,
          skills: mode === "suggest" ? skills : "",
          ...(mode === "suggest" ? { difficulty } : {}),
        },
      });
      setPages((p) => (force ? { [target]: projects } : { ...p, [target]: projects }));
      setPage(target);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't load suggestions.");
    } finally {
      setBusy(false);
    }
  };

  const startSuggestions = async () => {
    if (mode === "idea" && idea.trim().length < 3) {
      toast.error("Tell us a little about the project you want to build.");
      return;
    }
    if (mode === "job" && jobDescription.trim().length < 40) {
      toast.error("Paste the full job description so we can match projects to it.");
      return;
    }
    setStep(1);
    await loadPage(1, true);
  };

  const pickProject = (project: SuggestedProject) => {
    setChosen(project);
    setStep(2);
    setPapers(null);
    setSelectedPapers([]);
    setPaperPage(0);
  };

  const runPaperSearch = async () => {
    if (!chosen) return;
    setBusy(true);
    try {
      const found = await paperSearch({
        data: { title: chosen.title, description: chosen.description, domain },
      });
      setPapers(found);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't find research papers.");
      setPapers([]);
    } finally {
      setBusy(false);
    }
  };

  const togglePaper = (paper: ResearchPaper) =>
    setSelectedPapers((current) =>
      current.some((p) => p.url === paper.url && p.title === paper.title)
        ? current.filter((p) => !(p.url === paper.url && p.title === paper.title))
        : [...current, paper],
    );

  const afterPapers = async () => {
    if (!chosen) return;
    if (!needsDataset) {
      setStep(4);
      return;
    }
    setStep(3);
    if (datasets) return;
    setBusy(true);
    try {
      const found = await datasetSearch({
        data: { title: chosen.title, description: chosen.description, domain },
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
          idea: mode === "job" ? jobDescription.slice(0, 600) : idea,

          domain,
          title: chosen.title,
          description: chosen.description,
          techStack: chosen.tech_stack,
          dataset: needsDataset ? dataset : null,
          papers: selectedPapers,
          codeComplexity,
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
    <div className="workspace-home-surface landing-editorial workspace-builder min-h-[calc(100vh-7rem)] w-full">
      <main className="mx-auto w-full max-w-[76rem] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <header className="workspace-builder__header">
          <h1 className="mt-2 font-display text-[clamp(2.2rem,4vw,3.5rem)] font-semibold leading-[1.02] tracking-[-.065em]">
            Start with your idea.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            We’ll help shape it into a project plan, then guide you through the build.
          </p>
        </header>

        <ol className="workspace-builder__steps" aria-label="Project setup progress">
          {visibleSteps.map((s) => {
            const index = STEPS.indexOf(s);
            return (
              <li
                key={s}
                aria-current={index === step ? "step" : undefined}
                className={cn(
                  "workspace-builder__step",
                  index === step && "is-current",
                  index < step && "is-complete",
                )}
              >
                <span className="workspace-builder__step-number">
                  {index < step ? <Check aria-hidden="true" /> : String(index + 1).padStart(2, "0")}
                </span>
                <span>{s}</span>
              </li>
            );
          })}
        </ol>

        {step === 0 ? (
          <div className="workspace-builder__form panel">
            <div className="workspace-builder__form-intro">
              <span>STEP 01 <span aria-hidden="true">/</span> PROJECT BRIEF</span>
              <h2>Where should we start?</h2>
              <p>Choose a starting point. You can shape the details in the next step.</p>
            </div>
            <div className="workspace-builder__modes" role="group" aria-label="How to start">
              {(
                [
                  {
                    id: "idea",
                    title: "I have an idea",
                    detail: "Shape a project from a thought you already have.",
                  },
                  {
                    id: "suggest",
                    title: "Suggest a project",
                    detail: "Choose a field and let us find a useful direction.",
                  },
                  {
                    id: "job",
                    title: "From a job description",
                    detail: "Turn role requirements into a project you can show.",
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={mode === option.id}
                  onClick={() => setMode(option.id)}
                  className={cn("workspace-builder__mode", mode === option.id && "is-active")}
                >
                  <span
                    className={`workspace-builder__mode-art workspace-builder__mode-art--${option.id}`}
                    aria-hidden="true"
                  >
                    {option.id === "idea" ? (
                      <span className="workspace-builder__idea-card-image" />
                    ) : option.id === "suggest" ? (
                      <span className="mode-art__idea-grid"><i /><i /><i /><i /></span>
                    ) : (
                      <span className="mode-art__document"><i /><i /><i /></span>
                    )}
                  </span>
                  <span className="workspace-builder__mode-copy">
                    <span className="workspace-builder__mode-title">{option.title}</span>
                    <span className="workspace-builder__mode-detail">{option.detail}</span>
                  </span>
                  <span className="workspace-builder__mode-select" aria-hidden="true" />
                </button>
              ))}
            </div>

            {mode === "job" ? (
              <div className="workspace-builder__job-panel">
                <div className="workspace-builder__job-entry">
                  <div className="workspace-builder__job-label">
                    <Label htmlFor="jd">Paste the job description</Label>
                    <span>ROLE BRIEF</span>
                  </div>
                  <Textarea
                    id="jd"
                    rows={9}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the role, required skills, responsibilities, or tools here. We’ll use them to shape a project that demonstrates what the employer needs."
                    className="max-h-72"
                  />
                  <div className="workspace-builder__job-meta">
                    <span>Include as much of the posting as you can for a closer match.</span>
                    <span className="workspace-builder__job-count">
                      <strong>{jobDescription.trim().length}</strong> characters
                    </span>
                  </div>
                </div>
                <aside
                  className="workspace-builder__job-guide"
                  aria-label="Helpful job description details"
                >
                  <div className="workspace-builder__job-art" aria-hidden="true">
                    <span className="workspace-builder__job-paper">
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="workspace-builder__job-highlight" />
                  </div>
                  <p className="workspace-builder__job-guide-label">FOR THE BEST MATCH</p>
                  <h3>What to include</h3>
                  <ul>
                    <li>Key responsibilities</li>
                    <li>Required skills and tools</li>
                    <li>What success looks like</li>
                  </ul>
                  <p className="workspace-builder__job-guide-note">
                    We’ll turn the role requirements into a project you can build and discuss.
                  </p>
                </aside>
              </div>
            ) : null}

            {mode === "idea" ? (
              <div className="workspace-builder__idea-layout">
                <div className="workspace-builder__idea-field space-y-2">
                  <div className="workspace-builder__idea-label">
                    <Label htmlFor="idea">Describe what you want to build</Label>
                    <span>PROJECT IDEA</span>
                  </div>
                  <Textarea
                    id="idea"
                    rows={5}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="For example: a dashboard that predicts flight delays from historical data"
                  />
                  <div className="workspace-builder__examples" aria-label="Example project ideas">
                    <span>START WITH</span>
                    {[
                      "Predict customer churn",
                      "Track campus events",
                      "Analyse energy use",
                    ].map((example) => (
                      <button key={example} type="button" onClick={() => setIdea(example)}>
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
                <aside
                  className="workspace-builder__idea-guide"
                  aria-label="Project idea guidance"
                >
                  <div className="workspace-builder__idea-graphic" aria-hidden="true">
                    <span className="workspace-builder__idea-ring" />
                    <span className="workspace-builder__idea-core" />
                    <span className="workspace-builder__idea-node workspace-builder__idea-node--one" />
                    <span className="workspace-builder__idea-node workspace-builder__idea-node--two" />
                    <span className="workspace-builder__idea-node workspace-builder__idea-node--three" />
                    <span className="workspace-builder__idea-caption">A ROUGH IDEA IS ENOUGH</span>
                  </div>
                  <span className="workspace-builder__idea-guide-kicker">START WITH ONE THING</span>
                  <h3>A problem worth solving.</h3>
                  <p>Tell us who it helps, what it should do, or what you want to learn.</p>
                  <div className="workspace-builder__idea-guide-steps">
                    <span>
                      <b>01</b> The problem
                    </span>
                    <span>
                      <b>02</b> The people
                    </span>
                    <span>
                      <b>03</b> The outcome
                    </span>
                  </div>
                </aside>
              </div>
            ) : null}

            <div
              className={cn(
                "workspace-builder__config-grid",
                mode === "suggest" ? "is-suggesting" : "is-single",
              )}
            >
              <section className="workspace-builder__config-card workspace-builder__domain-card">
                <div className="workspace-builder__config-heading">
                  <span>PROJECT AREA</span>
                  <Label htmlFor="project-domain">Which domain does it belong to?</Label>
                </div>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger id="project-domain">
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
                <p className="workspace-builder__domain-note">
                  <span className={needsDataset ? "is-data" : "is-build"} aria-hidden="true" />
                  {needsDataset
                    ? "Includes a dataset selection step."
                    : "Goes straight to implementation."}
                </p>
              </section>

              {mode === "suggest" ? (
                <>
                  <section className="workspace-builder__config-card workspace-builder__difficulty-card">
                    <div className="workspace-builder__config-heading">
                      <span>PROJECT LEVEL</span>
                      <p>How challenging should it be?</p>
                    </div>
                    <div
                      className="workspace-builder__difficulty-options"
                      role="group"
                      aria-label="Project difficulty"
                    >
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          aria-pressed={difficulty === d.value}
                          onClick={() => setDifficulty(d.value)}
                          className={cn(
                            "workspace-builder__difficulty-option",
                            difficulty === d.value && "is-selected",
                          )}
                        >
                          <span className="workspace-builder__difficulty-scale" aria-hidden="true">
                            {[1, 2, 3].map((step) => (
                              <i key={step} className={step <= d.level ? "is-filled" : ""} />
                            ))}
                          </span>
                          <span className="workspace-builder__difficulty-name">{d.label}</span>
                          <span className="workspace-builder__difficulty-detail">{d.detail}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="workspace-builder__config-card workspace-builder__skills-card">
                    <div className="workspace-builder__config-heading">
                      <span>YOUR TOOLKIT <span className="is-optional">OPTIONAL</span></span>
                      <Label htmlFor="skills">What do you already know?</Label>
                    </div>
                    <Textarea
                      id="skills"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      rows={2}
                      placeholder="Add languages, tools, or skills you want to use"
                    />
                    <div
                      className="workspace-builder__skill-suggestions"
                      aria-label="Suggested skills"
                    >
                      <span>QUICK ADD</span>
                      {["Python", "SQL", "React", "Figma"].map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() =>
                            setSkills((current) => {
                              const values = current
                                .split(/[\n,;]/)
                                .map((value) => value.trim())
                                .filter(Boolean);
                              return values.some(
                                (value) => value.toLowerCase() === skill.toLowerCase(),
                              )
                                ? current
                                : [...values, skill].join(", ");
                            })
                          }
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                    <p className="workspace-builder__skills-note">
                      We’ll use your toolkit to tailor the project ideas to your experience.
                    </p>
                  </section>
                </>
              ) : null}
            </div>

            <div className="workspace-builder__form-footer">
              <p className="text-xs text-muted-foreground">
                {mode === "job"
                  ? "We’ll match project ideas to the skills and tools in the role."
                  : mode === "suggest"
                    ? "Your skill level helps us tailor the project ideas."
                    : "You can refine the idea and project details in the next step."}
              </p>
              <Button
                className="workspace-builder__primary"
                disabled={busy}
                onClick={() => void startSuggestions()}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
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
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void loadPage(page + 1)}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Next 4
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(() => {
                const list = pages[page] ?? [];
                const best = list.reduce(
                  (top, p) => ((p.market_score ?? 0) > (top?.market_score ?? -1) ? p : top),
                  null as SuggestedProject | null,
                );
                return list.map((project) => {
                  const score = project.market_score ?? 0;
                  const isTop = best?.title === project.title && score > 0;
                  return (
                    <div
                      key={project.title}
                      className={cn(
                        "workspace-builder__project-option panel relative flex flex-col gap-3 p-5",
                        isTop && "border-success/40 ring-1 ring-success/30",
                      )}
                    >
                      {isTop ? (
                        <span className="absolute -top-2.5 left-5 inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                          <Trophy className="h-3 w-3" /> Highest market potential
                        </span>
                      ) : null}
                      <div>
                        <h2 className="font-display text-lg">{project.title}</h2>
                        <span
                          className={cn(
                            "mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                            difficultyTone(project.difficulty),
                          )}
                        >
                          {project.difficulty}
                        </span>
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

                      {score > 0 ? (
                        <div className="rounded-xl border border-border bg-muted/30 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              <TrendingUp className="h-3.5 w-3.5" /> Market potential
                            </span>
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-xs font-medium",
                                marketTone(score),
                              )}
                            >
                              {marketLabel(score)} · {score}/100
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full transition-all", marketBar(score))}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          {project.market_reason ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {project.market_reason}
                            </p>
                          ) : null}
                          {project.market_signals?.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {project.market_signals.map((signal) => (
                                <span
                                  key={signal}
                                  className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                                >
                                  {signal}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      <Button
                        className="mt-auto"
                        onClick={() => void pickProject(project)}
                        disabled={busy}
                      >
                        Create this project <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                });
              })()}
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
                <BookOpen className="h-4 w-4 text-primary" /> Research papers for {chosen.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                Read a couple of these before you build. Pick the ones you want saved to your
                project's research section — open-access papers can be downloaded straight away.
              </p>
            </div>

            {!busy && papers === null ? (
              <div className="panel space-y-4 p-6">
                <p className="text-sm text-muted-foreground">
                  Want us to look for relevant research papers for this project? You can also skip
                  and add references later.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void runPaperSearch()}>
                    <BookOpen className="h-4 w-4" /> Find research papers
                  </Button>
                  <Button variant="outline" onClick={() => void afterPapers()}>
                    Skip for now <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}

            {busy ? (
              <div className="panel flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching for relevant papers…
              </div>
            ) : null}

            {!busy && papers && papers.length === 0 ? (
              <div className="panel p-6 text-sm text-muted-foreground">
                We couldn't verify any papers for this idea right now. You can continue and add
                references later from the project's research section.
              </div>
            ) : null}

            {(papers ?? []).slice(paperPage * 4, paperPage * 4 + 4).map((paper) => {
              const picked = selectedPapers.some(
                (p) => p.url === paper.url && p.title === paper.title,
              );
              return (
                <button
                  key={paper.url + paper.title}
                  type="button"
                  onClick={() => togglePaper(paper)}
                  className={cn(
                    "workspace-builder__selectable panel w-full space-y-3 p-5 text-left transition-colors",
                    picked ? "is-selected" : "",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium">{paper.title}</h3>
                    {picked ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {[paper.authors, paper.year, paper.venue].filter(Boolean).map((meta) => (
                      <span key={meta} className="rounded border border-border px-2 py-0.5">
                        {meta}
                      </span>
                    ))}
                    <span
                      className={cn(
                        "rounded px-2 py-0.5",
                        paper.downloadable
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {paper.downloadable ? "Open access" : "Paywalled / view only"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{paper.summary}</p>
                  <p className="rounded-md bg-primary/5 p-2 text-xs">
                    Why it helps: {paper.relevance}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-primary underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" /> Open paper
                    </a>
                    {paper.downloadable && paper.pdf_url ? (
                      <a
                        href={paper.pdf_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        download
                        className="inline-flex items-center gap-1 text-primary underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="h-3 w-3" /> Download PDF
                      </a>
                    ) : null}
                  </div>
                </button>
              );
            })}

            {(papers?.length ?? 0) > 4 ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paperPage === 0}
                  onClick={() => setPaperPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-muted-foreground">
                  Page {paperPage + 1} of {Math.ceil((papers?.length ?? 0) / 4)} ·{" "}
                  {selectedPapers.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paperPage >= Math.ceil((papers?.length ?? 0) / 4) - 1}
                  onClick={() =>
                    setPaperPage((p) => Math.min(Math.ceil((papers?.length ?? 0) / 4) - 1, p + 1))
                  }
                >
                  Next
                </Button>
              </div>
            ) : null}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={busy}>
                Back to suggestions
              </Button>
              {papers !== null ? (
                <Button onClick={() => void afterPapers()} disabled={busy}>
                  {needsDataset ? "Continue to dataset" : "Continue"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 && chosen ? (
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
                  "workspace-builder__selectable panel w-full space-y-3 p-5 text-left transition-colors",
                  dataset?.name === d.name ? "is-selected" : "",
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
                  <p className="rounded-md bg-success/10 p-2 text-success">
                    Good for: {d.good_for}
                  </p>
                  <p className="rounded-md bg-destructive/10 p-2 text-destructive">
                    Bad for: {d.bad_for}
                  </p>
                  <p className="rounded-md bg-warning/10 p-2">
                    Common mistake: {d.common_mistakes}
                  </p>
                </div>
              </button>
            ))}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Back to papers
              </Button>
              <Button disabled={!dataset} onClick={() => setStep(4)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 && chosen ? (
          <div className="panel space-y-4 p-6">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <Target className="h-4 w-4 text-primary" /> Finalise your project
            </h2>
            <Row label="Title" value={chosen.title} />
            <Row label="Description" value={chosen.description} />
            <Row
              label={domainBuildsCode(domain) ? "Tech stack" : "Tools & methods"}
              value={chosen.tech_stack.join(", ")}
            />
            {domainBuildsCode(domain) ? (
              <fieldset className="space-y-3 border-y border-border py-4">
                <legend className="font-medium">How should your code be written?</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {CODE_LEVELS.map((level) => (
                    <Button
                      key={level.value}
                      type="button"
                      variant={codeComplexity === level.value ? "default" : "outline"}
                      className="h-auto min-h-24 flex-col items-start whitespace-normal p-3 text-left"
                      onClick={() => setCodeComplexity(level.value)}
                    >
                      <span className="font-semibold">{level.label}</span>
                      <span className="mt-0.5 text-[11px] font-medium opacity-70">
                        {level.audience}
                      </span>
                      <span className="mt-1 text-[11px] font-normal italic opacity-80">
                        {level.tagline}
                      </span>
                      <span className="mt-1.5 text-xs font-normal opacity-80">{level.detail}</span>
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  This changes how the code is explained and organised, not how challenging the
                  project is.
                </p>
              </fieldset>
            ) : null}
            <Row label="Domain" value={DOMAINS.find((d) => d.value === domain)?.label ?? domain} />
            {needsDataset ? <Row label="Dataset" value={dataset?.name ?? "Not selected"} /> : null}
            <Row
              label="Research papers"
              value={
                selectedPapers.length
                  ? selectedPapers.map((p) => p.title).join("; ")
                  : "None selected"
              }
            />
            <p className="text-xs text-muted-foreground">
              Creating the project builds a 7–8 section implementation plan for this domain. Each
              section stays locked until you choose to generate it.
            </p>
            <div className="flex justify-between border-t border-border pt-4">
              <Button variant="ghost" onClick={() => setStep(needsDataset ? 3 : 2)} disabled={busy}>
                Back
              </Button>
              <Button onClick={() => void finalise()} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Creating…" : "Create project"}
              </Button>
            </div>
          </div>
        ) : null}
      </main>
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
