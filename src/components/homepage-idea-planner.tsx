import { ArrowRight, MousePointer2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const suggestions = ["Habit tracker app", "Portfolio website", "Weather dashboard"];
const featuredIdeas = [
  "Build Churn Prediction Dashboard",
  "Create a Habit Tracker App",
  "Design a Portfolio Website",
  "Launch a Weather Dashboard",
];
const stepExplanations = [
  "Clarify who the project is for, the problem it solves, and what success looks like.",
  "Choose the tools and organize the files needed to get started.",
  "Build the main features in small, practical steps.",
  "Try the key flows, check the results, and fix issues.",
  "Prepare setup instructions and explain how the finished project works.",
];

function buildSteps(idea: string) {
  const subject = idea.trim() || "your project";
  return [
    ["Problem statement", `define the need and goals for ${subject}`, "Step 1"],
    ["Setup files", "create the project structure and dependencies", "Step 2"],
    ["Build", "implement the project features", "Step 3"],
    ["Validate", "test the project and check the results", "Step 4"],
    ["Document", "record the approach, usage, and outcomes", "Step 5"],
  ];
}

/** Homepage try-it experience; planning stays local until a visitor starts a project. */
export function HomepageIdeaPlanner({ signedIn }: { signedIn: boolean }) {
  const [idea, setIdea] = useState("");
  const [plannedIdea, setPlannedIdea] = useState(featuredIdeas[0]!);
  const [animationStopped, setAnimationStopped] = useState(false);
  const [demoPhase, setDemoPhase] = useState<"typing" | "moving" | "clicking" | "idle">("typing");
  const [demoClick, setDemoClick] = useState(0);
  const [run, setRun] = useState(0);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const steps = buildSteps(plannedIdea);

  useEffect(() => {
    if (animationStopped || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let titleIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let pauseTicks = 0;
    let lastPlannedTitle = "";

    const timer = window.setInterval(() => {
      const title = featuredIdeas[titleIndex]!;
      if (pauseTicks > 0) {
        pauseTicks -= 1;
        return;
      }

      if (!deleting) {
        characterIndex += 1;
        setIdea(title.slice(0, characterIndex));
        if (characterIndex >= title.length) {
          deleting = true;
          pauseTicks = 32;
          if (lastPlannedTitle !== title) {
            lastPlannedTitle = title;
            setDemoPhase("moving");
            window.setTimeout(() => {
              setDemoPhase("hovering");
              window.setTimeout(() => {
                setDemoPhase("clicking");
                setDemoClick((value) => value + 1);
                window.setTimeout(() => {
                  setPlannedIdea(title);
                  setRun((value) => value + 1);
                  setDemoPhase("idle");
                }, 220);
              }, 520);
            }, 700);
          }
        }
      } else {
        characterIndex -= 1;
        setIdea(title.slice(0, characterIndex));
        if (characterIndex <= 0) {
          deleting = false;
          titleIndex = (titleIndex + 1) % featuredIdeas.length;
          pauseTicks = 10;
        }
      }
    }, 75);

    return () => window.clearInterval(timer);
  }, [animationStopped]);

  useEffect(() => {
    if (animationStopped && idea.trim()) setPlannedIdea(idea.trim());
  }, [animationStopped, idea]);

  const plan = () => {
    setPlannedIdea(idea.trim() || "your project");
    setRun((value) => value + 1);
  };

  return (
    <section
      className="homepage-idea-planner mx-auto mt-9 w-full max-w-2xl text-left lg:mt-0"
      aria-label="Try a project roadmap"
    >
      <div className="homepage-idea-planner__glow" aria-hidden="true" />
      <div className="homepage-idea-planner__card" onPointerDown={() => setAnimationStopped(true)}>
        <h2 className="font-display text-2xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-3xl">
          Type an idea. Get a roadmap.
        </h2>

        <form
          className="homepage-idea-planner__field"
          onSubmit={(event) => {
            event.preventDefault();
            plan();
          }}
        >
          <input
            value={idea}
            onChange={(event) => {
              setAnimationStopped(true);
              setIdea(event.target.value);
            }}
            onFocus={() => setAnimationStopped(true)}
            aria-label="Your project idea"
            placeholder="e.g. Expense tracker app"
            aria-live="polite"
          />
          <button type="submit" className={demoPhase === "clicking" ? "is-demo-clicked" : ""}>
            Plan it
            {!animationStopped && demoPhase !== "idle" ? (
              <MousePointer2
                className={`homepage-idea-planner__cursor is-${demoPhase}`}
                aria-hidden="true"
              />
            ) : null}
          </button>
        </form>

        <div className="flex flex-wrap gap-2" aria-label="Example project ideas">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="homepage-idea-planner__chip"
              onClick={() => {
                setIdea(suggestion);
                setPlannedIdea(suggestion);
                setRun((value) => value + 1);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <ol className="mt-4 grid gap-2" aria-live="polite">
          {steps.map(([title, detail, timing], index) => (
            <li key={`${run}-${title}`} style={{ animationDelay: `${index * 90}ms` }}>
              <button
                type="button"
                className={`homepage-idea-planner__step${activeStep === index ? " is-active" : ""}`}
                aria-expanded={activeStep === index}
                aria-controls={`roadmap-step-${index}`}
                onClick={() => setActiveStep(activeStep === index ? null : index)}
              >
                <span className="homepage-idea-planner__number">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </span>
                <span className="shrink-0 text-xs text-[#56708f]">{timing}</span>
              </button>
              {activeStep === index ? (
                <p className="homepage-idea-planner__step-extra" id={`roadmap-step-${index}`}>
                  {stepExplanations[index]}
                </p>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#c7d8ee]/70 pt-3">
          <span className="text-xs text-[#526985]">
            Your personalised project plan is one step away.
          </span>
          {signedIn ? (
            <Link to="/new-project" className="homepage-idea-planner__continue">
              Build it <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="homepage-idea-planner__continue"
            >
              Build it <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
