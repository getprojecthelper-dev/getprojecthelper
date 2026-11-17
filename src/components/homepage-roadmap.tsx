import "./homepage-roadmap.css";

const steps = [
  {
    number: "01",
    title: "Choose an idea",
    description: "Tell us what you want to build.",
    details: [
      "Start with your own idea or job description.",
      "Get a project suggestion when you need a starting point.",
    ],
  },
  {
    number: "02",
    title: "Understand what you’re building",
    description: "Discover the problem, explore solutions, and plan the right approach.",
    details: [
      "Identify a problem worth solving.",
      "Compare practical approaches and choose a technology stack.",
      "Find relevant research to guide your decisions.",
    ],
  },
  {
    number: "03",
    title: "Set up your project",
    description: "Get the tools, materials, datasets, and files ready.",
    details: [
      "Find useful libraries and project materials.",
      "Get dataset suggestions for data-related projects.",
      "Create starter folders and files.",
    ],
  },
  {
    number: "04",
    title: "Build",
    description: "Follow a clear implementation plan and learn as you code.",
    details: [
      "Break the project into manageable build steps.",
      "Read code explanations as you work through the implementation.",
    ],
  },
  {
    number: "05",
    title: "Validate",
    description: "Test your project and improve anything that needs work.",
    details: [
      "Review the project for issues and missing pieces.",
      "Work through improvements before you share it.",
    ],
  },
  {
    number: "06",
    title: "Document",
    description: "Turn your project into clear, well-structured documents.",
    details: [
      "Prepare project reports, proposals, and literature reviews.",
      "Export academic documents as compile-ready LaTeX.",
    ],
  },
  {
    number: "07",
    title: "Share",
    description: "Package your project and get it ready to show others.",
    details: [
      "Keep project files organised in one workspace.",
      "Get guidance if you get stuck along the way.",
    ],
  },
];

export function HomepageRoadmap() {
  return (
    <section id="how-it-works" className="homepage-roadmap landing-scroll-reveal" aria-labelledby="roadmap-heading">
      <div className="roadmap-heading-row landing-scroll-reveal">
        <div>
          <p className="roadmap-eyebrow">YOUR ROADMAP</p>
          <h2 id="roadmap-heading">What happens next</h2>
        </div>
      </div>
      <p className="roadmap-subtitle">One clear next step, with AI guidance along the way.</p>

      <ol className="roadmap-timeline landing-scroll-reveal">
        {steps.map((step) => (
          <li className="roadmap-step" key={step.number}>
            <span className="roadmap-step-number">{step.number}</span>
            <h3>{step.title}</h3>
            <p className="roadmap-step-description">{step.description}</p>
            <ul className="roadmap-step-details" aria-label={`${step.title} description`}>
              {step.details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
