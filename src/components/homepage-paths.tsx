import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Code2, Home, ListTodo, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
const PREVIEW_PROJECTS = [
  {
    id: "campus",
    title: "Campus Event Planner",
    summary: "Plan events and keep your campus connected.",
  },
  {
    id: "finance",
    title: "Personal Finance Tracker",
    summary: "Track spending and plan your monthly budget.",
  },
];
import "./homepage-paths.css";

const steps = [
  "Define the problem",
  "Plan the features",
  "Build the first version",
  "Review and improve",
];

/** Illustrative product previews; only the surrounding calls to action navigate. */
export function HomepagePaths() {
  const { session } = useAuth();
  return (
    <section id="services" className="homepage-paths" aria-labelledby="paths-heading">
      <h2 id="paths-heading">Your next project starts here.</h2>
      <div className="paths-grid">
        <article id="get-project" className="path-panel">
          <Link
            to={session ? "/new-project" : "/auth"}
            search={session ? {} : { mode: "signup" }}
            className="path-heading"
          >
            <span className="path-eyebrow">Build with AI</span>
            <h3>One idea. A clear path to build it.</h3>
            <span className="path-arrow" aria-hidden="true">
              <ArrowRight size={21} />
            </span>
          </Link>
          <a href="#how-it-works" className="path-roadmap-link">
            See how it works <ArrowRight size={15} aria-hidden="true" />
          </a>
          <div
            className="path-workspace path-preview"
            role="img"
            aria-label="Example AI workspace with a project roadmap and guidance for turning an idea into a project"
          >
            <aside className="path-sidebar" aria-hidden="true">
              <strong>Campus companion</strong>
              <span className="selected">
                <Home /> Project
              </span>
              <span>
                <ListTodo /> Roadmap
              </span>
              <span>
                <BookOpen /> Notes
              </span>
              <span>
                <Code2 /> Code
              </span>
            </aside>
            <div className="path-workspace-main" aria-hidden="true">
              <h4>Campus companion</h4>
              <p>A student app to plan classes, track tasks, and stay on top of campus life.</p>
              <div className="path-roadmap">
                <strong>Project roadmap</strong>
                <div className="path-table">
                  <div className="path-table-head">
                    <span>Step</span>
                    <span>Status</span>
                  </div>
                  {steps.map((step, index) => (
                    <div key={step}>
                      <span>
                        <small>{index + 1}</small>
                        {step}
                      </span>
                      <em className={index < 2 ? "done" : "progress"}>
                        {index < 2 ? "Done" : index === 2 ? "In progress" : "Up next"}
                      </em>
                    </div>
                  ))}
                </div>
              </div>
              <div className="path-ai-reply">
                Let’s start with who it helps and what it should do.
              </div>
              <div className="path-prompt">
                <span>Help me turn my idea into a project</span>
                <span className="path-send">
                  <ArrowRight size={18} />
                </span>
              </div>
            </div>
          </div>
        </article>
        <article className="path-panel">
          <Link
            to={session ? "/premade" : "/auth"}
            search={session ? {} : { mode: "signup" }}
            className="path-heading"
          >
            <span className="path-eyebrow">Explore ready-made projects</span>
            <h3>Find your starting point. Make it yours.</h3>
            <span className="path-arrow" aria-hidden="true">
              <ArrowRight size={21} />
            </span>
          </Link>
          <div
            className="path-catalog path-preview"
            role="img"
            aria-label="Illustrative catalog preview featuring Campus Event Planner and Personal Finance Tracker"
          >
            <div aria-hidden="true">
              <h4>Find your next project</h4>
              <div className="path-search">
                <Search size={17} />
                <span>Search projects, e.g. “event planner”</span>
              </div>
              <div className="path-filters">
                <span>All projects</span>
                <span>Web apps</span>
                <span>Data science</span>
              </div>
              <div className="path-products">
                {PREVIEW_PROJECTS.map((product, index) => (
                  <div className="path-product" key={product.id}>
                    <div className="path-product-screen">
                      <div className="path-mini-sidebar">
                        <b>{index === 0 ? "Campus" : "Finance"}</b>
                        <span>Overview</span>
                        <span>{index === 0 ? "Events" : "Transactions"}</span>
                        <span>{index === 0 ? "My RSVPs" : "Budgets"}</span>
                      </div>
                      <div className="path-mini-main">
                        <strong>{index === 0 ? "This week" : "Monthly overview"}</strong>
                        {index === 0 ? (
                          <>
                            <div className="path-calendar">
                              {[
                                "M",
                                "T",
                                "W",
                                "T",
                                "F",
                                "S",
                                "S",
                                ...Array.from({ length: 21 }, (_, i) => String(i + 1)),
                              ].map((day, i) => (
                                <span key={i} className={i === 18 ? "active" : ""}>
                                  {day}
                                </span>
                              ))}
                            </div>
                            <div className="path-event">
                              Design workshop <small>Thursday · 2:00 PM</small>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="path-balance">
                              <span>Monthly budget</span>
                              <b>On track</b>
                            </div>
                            <div className="path-bars">
                              {[38, 65, 48, 82, 57, 100].map((height, i) => (
                                <span key={i} style={{ height: `${height}%` }} />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <h5>{product.title}</h5>
                    <p>{product.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
