import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardList,
  Code2,
  FileCheck2,
  Lightbulb,
  Share2,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import "./homepage-roadmap.css";

const steps = [
  {
    number: "01",
    title: "Choose an idea",
    description: "Tell us what you want to build.",
    icon: Lightbulb,
  },
  {
    number: "02",
    title: "Understand what you’re building",
    description: "Discover the problem, explore solutions, and plan the right approach.",
    icon: Target,
  },
  {
    number: "03",
    title: "Set up your project",
    description: "Get the tools, materials, datasets, and files ready.",
    icon: ClipboardList,
  },
  {
    number: "04",
    title: "Build",
    description: "Follow a clear implementation plan and learn as you code.",
    icon: Code2,
  },
  {
    number: "05",
    title: "Validate",
    description: "Test your project and improve anything that needs work.",
    icon: ShieldCheck,
  },
  {
    number: "06",
    title: "Document",
    description: "Turn your project into clear, well-structured documents.",
    icon: FileCheck2,
  },
  {
    number: "07",
    title: "Share",
    description: "Package your project and get it ready to show others.",
    icon: Share2,
  },
];

export function HomepageRoadmap() {
  const { session } = useAuth();

  return (
    <section id="how-it-works" className="homepage-roadmap" aria-labelledby="roadmap-heading">
      <div className="roadmap-heading-row">
        <div>
          <p className="roadmap-eyebrow">YOUR ROADMAP</p>
          <h2 id="roadmap-heading">What happens next</h2>
        </div>
        <span className="roadmap-count">7 simple steps</span>
      </div>
      <p className="roadmap-subtitle">One clear next step, with AI guidance along the way.</p>

      <ol className="roadmap-timeline">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <li className="roadmap-step" key={step.number}>
              <span className="roadmap-step-kicker">STEP {step.number}</span>
              <span className="roadmap-step-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <h3>{step.title}</h3>
              <p className="roadmap-step-description">{step.description}</p>
              <div className="roadmap-step-details">
                {step.number === "01" && (
                  <ul>
                    <li>
                      <strong>I have an idea</strong>
                      <span>Get a custom roadmap.</span>
                    </li>
                    <li>
                      <strong>Suggest an idea</strong>
                      <span>Discover a project idea with AI.</span>
                    </li>
                    <li>
                      <strong>Use a job description</strong>
                      <span>Turn a role into a project.</span>
                    </li>
                  </ul>
                )}
                {step.number === "02" && (
                  <ul>
                    <li>Discover problems your project can solve.</li>
                    <li>Explore practical solutions.</li>
                    <li>Find the right technology stack.</li>
                    <li>Find relevant research papers.</li>
                  </ul>
                )}
                {step.number === "03" && (
                  <ul>
                    <li>Find relevant libraries, tools, and project materials.</li>
                    <li>Get multiple dataset suggestions for data-related projects.</li>
                    <li>Create project folders, directories, and starter files automatically.</li>
                  </ul>
                )}
                {step.number === "04" && (
                  <ul>
                    <li>Break the project into a clear implementation plan.</li>
                    <li>Read and learn from explained code, step by step.</li>
                  </ul>
                )}
                {step.number === "05" && (
                  <ul>
                    <li>Review the project and find anything that needs improvement.</li>
                    <li>Work through the fixes before you share it.</li>
                  </ul>
                )}
                {step.number === "06" && (
                  <ul>
                    <li>Create research papers and literature reviews with references and gaps.</li>
                    <li>Prepare project reports, synopses, and proposals.</li>
                    <li>Export academic documents as compile-ready LaTeX.</li>
                  </ul>
                )}
                {step.number === "07" && (
                  <ul>
                    <li>Keep project files organised in one workspace.</li>
                    <li>Ask for guidance whenever you get stuck.</li>
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="roadmap-support">
        <div className="roadmap-support-message">
          <h3>You do not have to figure everything out alone.</h3>
          <p>Get a clear next step, organised project files, and guidance when you need it.</p>
        </div>
        <div className="roadmap-included">
          <strong>WHAT YOU GET</strong>
          <p>A roadmap, clear tasks, project files, documents, and support as you build.</p>
        </div>
        <Link
          className="roadmap-cta"
          to={session ? "/new-project" : "/auth"}
          search={session ? {} : { mode: "signup" }}
        >
          Start building <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
