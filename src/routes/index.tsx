import { HomepageRoadmap } from "@/components/homepage-roadmap";
import { HomepageIdeaPlanner } from "@/components/homepage-idea-planner";
import brandMark from "@/assets/mentor-mark.png";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  BriefcaseBusiness,
  BookOpen,
  Check,
  Files,
  Folder,
  Home,
  LayoutGrid,
  Lightbulb,
  ListTodo,
  Menu,
  Plus,
  Share2,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listHomepageListings } from "@/lib/premade-listings.functions";
import { getPaddleEnvironment } from "@/lib/paddle";

const techStackColors: Record<string, string> = {
  react: "bg-[#d9f3ff] text-[#075985]",
  typescript: "bg-[#dbeafe] text-[#1d4ed8]",
  supabase: "bg-[#dcfce7] text-[#166534]",
  recharts: "bg-[#f3e8ff] text-[#7e22ce]",
  python: "bg-[#fef3c7] text-[#92400e]",
  fastapi: "bg-[#cffafe] text-[#155e75]",
  "node.js": "bg-[#e4f4dc] text-[#3f6212]",
  postgresql: "bg-[#e0eafe] text-[#1e40af]",
};

function getTechStackColor(technology: string) {
  return techStackColors[technology.trim().toLowerCase()] ?? "bg-[#eee9ff] text-[#5b3da8]";
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GetProjectHelper | Custom projects and ready-made products" },
      {
        name: "description",
        content: "Request a guided custom project or explore ready-made digital project products.",
      },
      {
        property: "og:title",
        content: "GetProjectHelper | Custom projects and ready-made products",
      },
      {
        property: "og:description",
        content: "Choose a custom project or explore a ready-made digital product.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://getprojecthelper.com/" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://getprojecthelper.com/" }],
  }),
  component: Landing,
});

function Landing() {
  const environment = getPaddleEnvironment();
  const fetchListings = useServerFn(listHomepageListings);
  const { data: listings = [] } = useQuery({
    queryKey: ["homepage-listings", environment],
    queryFn: () => fetchListings({ data: { environment } }),
  });
  const demoProjects = [
    {
      id: "demo-campus-companion",
      title: "Campus Companion",
      description:
        "Plan classes, track assignments, and keep campus events in one simple student dashboard.",
      techStack: "React · TypeScript · Supabase",
      imageUrl: "/student-project-workspace.png",
      badge: "POPULAR PICK",
      priceMinor: 0,
      isAvailable: false,
      demo: true,
    },
    {
      id: "demo-analytics-dashboard",
      title: "Analytics Dashboard",
      description: "Explore clear charts and useful metrics in a responsive analytics workspace.",
      techStack: "React · TypeScript · Recharts",
      imageUrl: "/analytics-dashboard-project.png",
      badge: "TRENDING",
      priceMinor: 0,
      isAvailable: false,
      demo: true,
    },
    {
      id: "demo-project-collaboration",
      title: "Project Collaboration",
      description: "Organize tasks, share updates, and keep a small team moving together.",
      techStack: "React · Node.js · PostgreSQL",
      imageUrl: "/project-collaboration.png",
      badge: "NEW TECH",
      priceMinor: 0,
      isAvailable: false,
      demo: true,
    },
    {
      id: "demo-research-paper-workspace",
      title: "Research Paper Workspace",
      description:
        "Collect sources, organize literature notes, and shape your findings into a clear report.",
      techStack: "Python · FastAPI · PostgreSQL",
      imageUrl: "/research-paper-workspace.svg",
      badge: "NEW",
      priceMinor: 0,
      isAvailable: false,
      demo: true,
    },
  ];
  const catalogPreview =
    listings.length > 0
      ? listings.slice(0, 3).map((listing) => ({ ...listing, badge: null, demo: false }))
      : demoProjects;
  const { session } = useAuth();
  const getStarted = session ? "/welcome" : "/auth";
  const signup = session ? {} : { mode: "signup" as const };
  const products = session ? "/premade" : "/auth";
  const productSearch = session ? {} : { mode: "signup" as const };

  return (
    <div className="landing-editorial min-h-screen bg-white text-[#111111] selection:bg-[#d4f5df] selection:text-[#111111]">
      <Header
        getStarted={getStarted}
        signup={signup}
        products={products}
        productSearch={productSearch}
        signedIn={Boolean(session)}
      />
      <main>
        <section
          id="get-project"
          className="landing-hero relative scroll-mt-8 overflow-hidden px-5 pb-0 pt-8 sm:px-8 sm:pt-10 lg:pt-12"
        >
          <svg
            className="landing-hero__motion"
            viewBox="0 0 1440 760"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <pattern id="landing-blueprint-dots" width="26" height="26" patternUnits="userSpaceOnUse">
                <circle cx="1.2" cy="1.2" r="1" fill="#6d8fc9" fillOpacity="0.22" />
              </pattern>
              <linearGradient id="landing-glass-stroke" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#5a92f5" stopOpacity="0.2" />
                <stop offset="1" stopColor="#9575e8" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <rect className="landing-hero__dot-field" x="0" y="0" width="1440" height="760" fill="url(#landing-blueprint-dots)" />
            <g className="landing-hero__blueprint" aria-hidden="true">
              <circle cx="720" cy="380" r="225" />
              <circle cx="720" cy="380" r="274" />
              <ellipse cx="720" cy="380" rx="335" ry="138" transform="rotate(-28 720 380)" />
              <path d="M340 380h760M720 70v620" />
              <rect x="698" y="126" width="44" height="44" rx="12" />
              <rect x="1032" y="358" width="44" height="44" rx="12" />
              <rect x="364" y="358" width="44" height="44" rx="12" />
            </g>
            <g className="landing-hero__motion-track landing-hero__motion-track--one">
              <path className="landing-hero__route" d="M-80 540 C180 280 330 680 600 430 S1050 180 1520 400" />
              <path className="landing-hero__route landing-hero__route--secondary" d="M-80 590 C180 330 330 730 600 480 S1050 230 1520 450" />
              <circle className="landing-hero__node-halo" cx="602" cy="430" r="10" />
              <circle className="landing-hero__node" cx="602" cy="430" r="3.5" />
              <circle className="landing-hero__node-halo landing-hero__node-halo--late" cx="1048" cy="230" r="10" />
              <circle className="landing-hero__node" cx="1048" cy="230" r="3.5" />
            </g>
            <g className="landing-hero__motion-track landing-hero__motion-track--two">
              <path className="landing-hero__route" d="M-60 250 C250 500 390 150 690 360 S1120 620 1500 300" />
              <path className="landing-hero__route landing-hero__route--secondary" d="M-60 300 C250 550 390 200 690 410 S1120 670 1500 350" />
              <circle className="landing-hero__node-halo" cx="690" cy="360" r="10" />
              <circle className="landing-hero__node" cx="690" cy="360" r="3.5" />
              <circle className="landing-hero__node-halo landing-hero__node-halo--late" cx="1120" cy="620" r="10" />
              <circle className="landing-hero__node" cx="1120" cy="620" r="3.5" />
            </g>
          </svg>
          <div className="relative z-10 mx-auto grid max-w-[90rem] items-center gap-10 lg:grid-cols-[.95fr_1.05fr] lg:gap-16 xl:gap-20">
            <div className="text-center lg:text-left">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#0866e8]">
                Your next big idea starts here
              </p>
              <h1 className="mx-auto max-w-3xl font-display text-[clamp(2.5rem,4vw,4.75rem)] font-semibold leading-[1.02] tracking-[-.07em] lg:mx-0">
                From idea to a complete, end to end project in minutes
              </h1>
              <p className="mx-auto mt-7 max-w-lg text-base leading-7 text-[#52525b] sm:text-lg sm:leading-8 lg:mx-0">
                <span className="block">
                  Start with a job description, a college project idea, or a professional project
                  goal. Let AI help shape it into a complete, end to end project.
                </span>
                <span className="mt-4 block border-l-2 border-[#d1f5dc] pl-3 text-[#71717a]">
                  Explore ready-to-use products for a faster start.
                </span>
              </p>
            </div>
            <div>
              <HomepageIdeaPlanner signedIn={Boolean(session)} />
              <Link
                to={products}
                search={productSearch}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#0757ad] hover:underline"
              >
                Or browse ready-made products <ArrowDownRight className="size-4" />
              </Link>
            </div>

            <div className="hidden" aria-label="Preview of a project workspace">
              <div className="flex h-11 items-center gap-2 border-b border-[#e4e4e7] bg-[#fafafa] px-4">
                <span className="size-2.5 rounded-full bg-[#ff6058]" />
                <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
                <div className="ml-3 flex h-8 min-w-44 items-center gap-2 rounded-t-lg border border-b-0 border-[#e4e4e7] bg-white px-3 text-xs font-medium text-[#27272a]">
                  <span className="grid size-4 place-items-center rounded bg-[#0866e8] text-[9px] font-bold text-white">
                    G
                  </span>{" "}
                  GetProjectHelper
                </div>
                <span className="ml-auto hidden text-xs text-[#71717a] sm:block">
                  Workspace preview
                </span>
              </div>
              <div className="grid min-h-[300px] grid-cols-[150px_1fr] sm:grid-cols-[190px_1fr]">
                <aside className="border-r border-[#e4e4e7] bg-[#fbfbfa] p-3 sm:p-4">
                  <div className="grid gap-1.5 text-xs font-medium text-[#52525b]">
                    <span className="flex items-center gap-2 rounded-md px-2 py-2">
                      <Home className="size-3.5" /> My projects
                    </span>
                    <span className="flex items-center gap-2 rounded-md px-2 py-2">
                      <LayoutGrid className="size-3.5" /> Templates
                    </span>
                    <span className="flex items-center gap-2 rounded-md px-2 py-2">
                      <BookOpen className="size-3.5" /> Products
                    </span>
                  </div>
                  <div className="my-3 border-t border-[#e4e4e7]" />
                  <span className="flex items-center gap-2 rounded-md bg-[#e8f2ff] px-2 py-2 text-xs font-semibold text-[#0757ad]">
                    <Folder className="size-3.5" /> Website redesign
                  </span>
                  <span className="mt-2 flex items-center gap-2 px-2 py-1.5 text-xs text-[#52525b]">
                    <ListTodo className="size-3.5" /> Roadmap
                  </span>
                  <span className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#52525b]">
                    <Files className="size-3.5" /> Project files
                  </span>
                </aside>
                <div className="min-w-0 p-4 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e4e7] pb-4">
                    <div className="flex items-center gap-2">
                      <Folder className="size-5 text-[#52525b]" />
                      <h2 className="font-display text-lg font-semibold tracking-tight sm:text-2xl">
                        Website redesign
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#e4e4e7] px-3 text-xs font-medium text-[#3f3f46]"
                    >
                      <Share2 className="size-3.5" /> Share
                    </button>
                  </div>
                  <div className="flex gap-5 border-b border-[#e4e4e7] text-xs font-medium text-[#52525b]">
                    <span className="border-b-2 border-[#0866e8] py-3 text-[#0757ad]">Roadmap</span>
                    <span className="py-3">Tasks</span>
                    <span className="py-3">Notes</span>
                    <span className="py-3">Files</span>
                  </div>
                  <div className="grid gap-4 pt-4 lg:grid-cols-[1.3fr_.9fr]">
                    <div className="rounded-xl border border-[#e4e4e7] p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Project roadmap</h3>
                        <span className="text-[10px] text-[#71717a]">NEXT 4 WEEKS</span>
                      </div>
                      <div className="mt-4 grid grid-cols-[82px_repeat(4,minmax(0,1fr))] items-center gap-y-3 text-[10px] text-[#71717a] sm:grid-cols-[100px_repeat(4,minmax(0,1fr))]">
                        <span />
                        {["Week 1", "Week 2", "Week 3", "Week 4"].map((week) => (
                          <span key={week}>{week}</span>
                        ))}
                        <span className="text-[#3f3f46]">Plan & scope</span>
                        <span className="col-span-1 h-2.5 rounded-full bg-[#b8edc8]" />
                        <span />
                        <span />
                        <span />
                        <span className="text-[#3f3f46]">Design</span>
                        <span />
                        <span className="col-span-1 h-2.5 rounded-full bg-[#bad7ff]" />
                        <span />
                        <span />
                        <span className="text-[#3f3f46]">Build</span>
                        <span />
                        <span />
                        <span className="col-span-1 h-2.5 rounded-full bg-[#d9c7ff]" />
                        <span />
                        <span className="text-[#3f3f46]">Test & launch</span>
                        <span />
                        <span />
                        <span />
                        <span className="h-2.5 rounded-full bg-[#ffe29a]" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#e4e4e7] p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Next tasks</h3>
                        <span className="flex items-center gap-1 text-[10px] text-[#52525b]">
                          <Plus className="size-3" /> New
                        </span>
                      </div>
                      <ul className="mt-3 divide-y divide-[#f0f0f1] text-xs">
                        {[
                          [true, "Define project goals"],
                          [true, "Complete design mockups"],
                          [false, "Build core pages"],
                          [false, "Run final review"],
                        ].map(([done, label]) => (
                          <li key={String(label)} className="flex items-center gap-2.5 py-2">
                            <span
                              className={`grid size-4 place-items-center rounded border ${done ? "border-[#18aa4a] bg-[#18aa4a] text-white" : "border-[#a1a1aa]"}`}
                            >
                              {done && <Check className="size-3" />}
                            </span>
                            <span
                              className={done ? "text-[#71717a] line-through" : "text-[#27272a]"}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="landing-section landing-section--choices relative isolate overflow-hidden border-y px-5 py-14 text-[#111111] sm:px-8 sm:py-18"
        >
          <div className="landing-section__content mx-auto max-w-[90rem]">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0866e8]">
                Choose where to start
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-[-.06em] sm:text-5xl">
                What do you have in mind?
              </h2>
              <p className="mt-3 text-base leading-7 text-[#62666e] sm:text-lg">
                Start with an idea, a job description, or a domain you want to explore.
              </p>
            </div>

            <div className="mt-9 grid gap-3 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "I have an idea",
                  description:
                    "For a college assignment or a professional goal, start with a short description. We’ll help turn it into a project plan.",
                  action: "Shape my idea",
                },
                {
                  number: "02",
                  title: "I have a job description",
                  description:
                    "Use the role’s skills and requirements to shape a relevant project you can build and discuss in interviews.",
                  action: "Use a job description",
                },
                {
                  number: "03",
                  title: "Suggest an idea for me",
                  description:
                    "Choose a domain and let AI suggest a project that fits what you want to learn or demonstrate.",
                  action: "Explore project ideas",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="landing-choice group relative flex min-h-56 flex-col px-5 py-7 transition-colors duration-200 sm:px-7 sm:py-8 md:min-h-60"
                >
                  <span className="mb-5 font-mono text-xs tracking-[.14em] text-[#7a8492]">
                    {item.number}
                  </span>
                  <h3 className="font-display text-xl font-semibold tracking-[-.035em] sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[#62666e] sm:text-base sm:leading-7">
                    {item.description}
                  </p>
                  <Link
                    to={getStarted}
                    search={signup}
                    className="mt-auto inline-flex min-h-11 w-fit items-end pt-5 text-sm font-semibold text-[#0757ad] underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-current group-hover:text-[#0866e8] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0866e8]"
                  >
                    {item.action}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <HomepageRoadmap />
        <section
          id="services"
          className="landing-section landing-section--products relative isolate scroll-mt-8 overflow-hidden border-y px-5 py-16 text-[#111111] sm:px-8 sm:py-20"
        >
          <div className="landing-section__content mx-auto max-w-[90rem]">
            <div className="flex flex-col gap-6 border-b border-[#e4e4e7] pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="products"
                  className="max-w-4xl font-display text-5xl font-semibold leading-[.94] tracking-[-.075em] sm:text-6xl"
                >
                  Explore ready-made projects
                </h2>
                <p className="mt-3 max-w-xl text-lg leading-7 text-[#62666e]">
                  Find your starting point. Make it yours.
                </p>
              </div>
              <Button
                asChild
                className="h-11 w-fit rounded-xl bg-[#e8f2ff] px-5 text-sm font-semibold text-[#0757ad] shadow-none hover:bg-[#d9eaff]"
              >
                <Link to={products} search={productSearch}>
                  Browse all projects <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            {catalogPreview.length > 0 && (
              <div className="mx-auto mt-7 grid max-w-[90rem] items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {catalogPreview.map((product) => (
                  <article
                    key={product.id}
                    className="landing-product-card flex min-w-0 flex-col overflow-hidden rounded-xl transition duration-200 hover:-translate-y-1"
                  >
                    {product.imageUrl ? (
                      <div className="relative">
                        <img
                          src={product.imageUrl}
                          alt={`Preview image for ${product.title}`}
                          loading="lazy"
                          className="aspect-[16/10] w-full border-b border-[#e4e4e7] object-cover"
                        />
                        {product.demo && (
                          <span
                            aria-label={`Demo tag: ${product.badge}`}
                            className={`absolute right-3 top-3 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#111111] shadow-sm ${
                              product.badge === "TRENDING"
                                ? "bg-[#f5e642]"
                                : product.badge === "NEW TECH"
                                  ? "bg-[#d4f5df]"
                                  : "bg-[#dceaff]"
                            }`}
                          >
                            {product.badge}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        role="img"
                        aria-label={`Image preview unavailable for ${product.title}`}
                        className="flex aspect-[16/10] items-end justify-between border-b border-[#e4e4e7] bg-[#f5f8fc] p-5"
                      >
                        <span className="max-w-[18rem] font-display text-3xl font-semibold leading-[.95] tracking-[-.055em]">
                          {product.title}
                        </span>
                        <span className="font-mono text-xs font-bold uppercase text-[#0757ad]">
                          Project
                        </span>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-semibold leading-tight tracking-[-.04em] sm:text-2xl">
                          {product.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#62666e]">
                            Tech stack
                          </span>
                          <div className="flex min-w-0 flex-wrap gap-1">
                            {product.techStack.split(/[·,]/).map((technology) => {
                              const label = technology.trim();
                              return (
                                <span
                                  key={label}
                                  className={`rounded-full px-2 py-1 text-[10px] font-semibold leading-none ${getTechStackColor(label)}`}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        {product.demo && (
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            <span className="mr-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#62666e]">
                              Includes
                            </span>
                            {["Dataset", "Documentation", "Report", "Research paper"].map(
                              (item) => (
                                <span
                                  key={item}
                                  className="whitespace-nowrap rounded-full border border-[#d4d4d8] bg-white/75 px-1.5 py-1 text-[9px] font-medium leading-none text-[#3f3f46]"
                                >
                                  {item}
                                </span>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm leading-5 text-[#525866]">
                        {product.description}
                      </p>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                        <div>
                          <p className="text-xs text-[#62666e]">
                            {product.isAvailable ? "One-time purchase" : "Currently unavailable"}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-[#111111] sm:text-xl">
                            ₹{(product.priceMinor / 100).toLocaleString("en-IN")}
                          </p>
                        </div>
                        {product.demo ? (
                          <span className="inline-flex min-h-11 items-center rounded-lg border border-[#d4d4d8] px-3 py-2 text-sm font-semibold text-[#62666e]">
                            Demo project
                          </span>
                        ) : !product.isAvailable ? (
                          <span className="inline-flex min-h-11 items-center rounded-lg border border-[#d4d4d8] px-3 py-2 text-sm font-semibold text-[#62666e]">
                            Not available
                          </span>
                        ) : session ? (
                          <Link
                            to="/premade/$projectId"
                            params={{ projectId: product.id }}
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0866e8] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0757c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0866e8]"
                          >
                            Explore project <ArrowRight className="size-4" />
                          </Link>
                        ) : (
                          <Link
                            to="/auth"
                            search={{ mode: "signup" }}
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0866e8] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0757c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0866e8]"
                          >
                            Explore project <ArrowRight className="size-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer
        getStarted={getStarted}
        signup={signup}
        products={products}
        productSearch={productSearch}
      />
    </div>
  );
}

function Header({
  getStarted,
  signup,
  products,
  productSearch,
  signedIn,
}: {
  getStarted: "/welcome" | "/auth";
  signup: Record<string, string>;
  products: "/premade" | "/auth";
  productSearch: Record<string, string>;
  signedIn: boolean;
}) {
  return (
    <header className="landing-header border-b px-5 py-4 sm:px-8">
      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-5">
        <Link
          to="/"
          className="flex items-center gap-3 font-display text-lg font-semibold tracking-[-.04em]"
        >
          <img src={brandMark} alt="" className="size-8 rounded-xl object-cover" />
          <span>GetProjectHelper</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          <a href="#services" className="hover:text-[#0866e8]">
            Product
          </a>
          <a href="#how-it-works" className="hover:text-[#0866e8]">
            Resources
          </a>
          <Link to="/pricing" className="hover:text-[#0866e8]">
            Pricing
          </Link>
        </nav>
        <div className="hidden items-center gap-5 sm:flex">
          {!signedIn && (
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="text-sm font-semibold hover:text-[#0866e8]"
            >
              Sign in
            </Link>
          )}
          <Link
            to={getStarted}
            search={signup}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0866e8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0757c7]"
          >
            Get started
          </Link>
        </div>
        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg text-[#14120f] hover:bg-[#f4f4f5] hover:text-[#14120f]"
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-l-[#e4e4e7] bg-white text-[#14120f]">
              <SheetTitle className="font-display text-lg">GetProjectHelper</SheetTitle>
              <nav className="mt-9 grid border-t border-[#e4e4e7]">
                <SheetClose asChild>
                  <a
                    href="#get-project"
                    className="border-b border-[#e4e4e7] py-4 text-sm font-semibold"
                  >
                    Get a Project
                  </a>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to={products}
                    search={productSearch}
                    className="border-b border-[#e4e4e7] py-4 text-sm font-semibold"
                  >
                    Products
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <a
                    href="#services"
                    className="border-b border-[#e4e4e7] py-4 text-sm font-semibold"
                  >
                    Product
                  </a>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/pricing"
                    className="border-b border-[#e4e4e7] py-4 text-sm font-semibold"
                  >
                    Pricing
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to={getStarted}
                    search={signup}
                    className="mt-6 rounded-xl bg-[#0866e8] px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Get started
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Footer({
  getStarted,
  signup,
  products,
  productSearch,
}: {
  getStarted: "/welcome" | "/auth";
  signup: Record<string, string>;
  products: "/premade" | "/auth";
  productSearch: Record<string, string>;
}) {
  return (
    <footer className="landing-footer mx-2 mb-2 rounded-[18px] px-4 py-4 text-[#f5f7fa] sm:px-5 sm:py-5">
      <div className="mx-auto max-w-[90rem]">
        <div className="border-b border-[#353a44] pb-3">
          <p className="font-display text-base font-semibold">GetProjectHelper</p>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-[#c0c5cf]">
            From ideas to working solutions. Explore, plan, and build projects with confidence.
          </p>
        </div>
        <div className="grid gap-x-8 gap-y-4 border-b border-[#353a44] py-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-sm font-semibold">Platform</p>
            <div className="mt-2 grid justify-items-start gap-1 text-[13px] text-[#c0c5cf]">
              <Link to={getStarted} search={signup} className="transition-colors hover:text-white">
                Get a Project
              </Link>
              <Link
                to={products}
                search={productSearch}
                className="transition-colors hover:text-white"
              >
                Buy a Product
              </Link>
              <a href="#how-it-works" className="transition-colors hover:text-white">
                How It Works
              </a>
              <a
                href="mailto:support@getprojecthelper.com"
                className="transition-colors hover:text-white"
              >
                Contact Us
              </a>
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-semibold">Legal</p>
            <div className="mt-2 grid justify-items-start gap-1 text-[13px] text-[#c0c5cf]">
              <Link to="/privacy" className="transition-colors hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white">
                Terms of Service
              </Link>
              <Link to="/refund-policy" className="transition-colors hover:text-white">
                Refund Policy
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-white">
                Cookie Policy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white">
                License Agreement
              </Link>
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-semibold">Trust &amp; Safety</p>
            <div className="mt-2 grid justify-items-start gap-1 text-[13px] text-[#c0c5cf]">
              <a href="#ai-usage-disclaimer" className="transition-colors hover:text-white">
                AI Usage Disclaimer
              </a>
              <Link to="/privacy" className="transition-colors hover:text-white">
                Data Protection
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white">
                Acceptable Use
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-white">
                Security
              </Link>
              <a
                href="mailto:support@getprojecthelper.com?subject=Report%20an%20issue"
                className="transition-colors hover:text-white"
              >
                Report an Issue
              </a>
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-semibold">Company &amp; Support</p>
            <div className="mt-2 grid justify-items-start gap-1 text-[13px] text-[#c0c5cf]">
              <a href="#get-project" className="transition-colors hover:text-white">
                About Us
              </a>
              <a
                href="mailto:support@getprojecthelper.com?subject=Help%20request"
                className="transition-colors hover:text-white"
              >
                Help Center
              </a>
              <a
                href="mailto:support@getprojecthelper.com?subject=Grievance%20redressal"
                className="transition-colors hover:text-white"
              >
                Grievance Redressal
              </a>
              <a
                href="mailto:support@getprojecthelper.com"
                className="transition-colors hover:text-white"
              >
                Contact
              </a>
              <a
                href="mailto:support@getprojecthelper.com?subject=Accessibility%20feedback"
                className="transition-colors hover:text-white"
              >
                Accessibility
              </a>
            </div>
          </div>
        </div>
        <div
          id="ai-usage-disclaimer"
          className="border-b border-[#353a44] py-3 text-center text-[13px] leading-5 text-[#c0c5cf]"
        >
          <p>AI can make mistakes. Please verify important information before relying on it.</p>
        </div>
        <div className="pt-3 text-xs text-[#c0c5cf]">
          <span>© 2026 GetProjectHelper. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
