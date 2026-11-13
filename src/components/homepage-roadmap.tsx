import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import "./homepage-roadmap.css";

const phases = [
  {
    name: "Plan",
    description: "Give your idea a direction.",
    steps: [
      { number: "01", title: "Choose an idea", detail: "Tell us what you want to build." },
      {
        number: "02",
        title: "Understand What You're Building",
        detail:
          "Discover the problems your project can solve, explore practical solutions, and find the right technology stack for your project.",
      },
      {
        number: "03",
        title: "Set up your project automatically",
        detail:
          "Let GetProjectHelper set up your project and files automatically, so you can focus on building.",
      },
    ],
  },
  {
    name: "Build",
    description: "Turn the plan into something real.",
    steps: [
      { number: "04", title: "Build", detail: "Follow guided tasks to create each part." },
      {
        number: "05",
        title: "Validate",
        detail: "Test your project and improve anything that needs work.",
      },
    ],
  },
  {
    name: "Deliver",
    description: "Make your work ready to share.",
    steps: [
      {
        number: "06",
        title: "Document",
        detail: "Create clear reports that explain your project.",
      },
      {
        number: "07",
        title: "Present",
        detail: "Prepare slides and practise common project questions.",
      },
      { number: "08", title: "Share", detail: "Package your project and show it to others." },
    ],
  },
];

export function HomepageRoadmap() {
  const { session } = useAuth();
  return (
    <section id="how-it-works" className="homepage-roadmap" aria-labelledby="roadmap-heading">
      <div className="roadmap-intro">
        <p className="roadmap-eyebrow">HOW BUILDING WITH AI WORKS</p>
        <h2 id="roadmap-heading">From your first idea to your final presentation.</h2>
        <div className="roadmap-summary">
          <p>One clear next step, with AI guidance along the way.</p>
          <span>8 steps. One connected workspace.</span>
        </div>
      </div>
      <div className="roadmap-phases">
        {phases.map((phase, index) => (
          <div className="roadmap-phase" key={phase.name}>
            <div className="roadmap-phase-heading">
              <span className={`roadmap-phase-label phase-${index}`}>{phase.name}</span>
              <p>{phase.description}</p>
            </div>
            <ol start={Number(phase.steps[0].number)}>
              {phase.steps.map((step) => (
                <li key={step.number}>
                  <span className="roadmap-number" aria-hidden="true">
                    {step.number}
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    {step.number === "01" ? (
                      <dl className="roadmap-idea-options">
                        <div>
                          <dt>I have an idea</dt>
                          <dd>Get a custom roadmap.</dd>
                        </div>
                        <div>
                          <dt>Suggest an idea</dt>
                          <dd>Discover a project idea with AI.</dd>
                        </div>
                        <div>
                          <dt>Use a job description</dt>
                          <dd>Turn a role into a project.</dd>
                        </div>
                      </dl>
                    ) : step.number === "02" ? (
                      <ul className="roadmap-step-bullets">
                        <li>Discover the problems your project can solve</li>
                        <li>Explore practical solutions</li>
                        <li>It finds the right technology stack for your project</li>
                        <li>GetProjectHelper finds research papers relevant to your project</li>
                      </ul>
                    ) : step.number === "03" ? (
                      <>
                        <p className="roadmap-step-lead">{step.detail}</p>
                        <ul className="roadmap-step-bullets">
                          <li>Finds relevant libraries, tools, and materials for your project.</li>
                          <li>
                            For data related projects, suggests multiple relevant datasets so you
                            have options without spending hours searching.
                          </li>
                          <li>
                            Creates project folders, directories, and files so you can start
                            building without setting everything up manually.
                          </li>
                        </ul>
                      </>
                    ) : (
                      <p>{step.detail}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <div className="roadmap-support">
        <div>
          <h3>You don’t have to figure everything out alone.</h3>
          <p>
            See what to do next, keep your project files organised, and ask for guidance when you
            get stuck.
          </p>
        </div>
        <div className="roadmap-included">
          <strong>WHAT YOU GET</strong>
          <p>A roadmap, clear tasks, project files, documents and presentation support.</p>
        </div>
        <Link
          className="roadmap-cta"
          to={session ? "/new-project" : "/auth"}
          search={session ? {} : { mode: "signup" }}
        >
          Build a project with AI <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
