import { HomepageRoadmap } from "@/components/homepage-roadmap";
import { HomepageIdeaPlanner } from "@/components/homepage-idea-planner";
import { HomepageProjectPreview, type ProjectKind } from "@/components/homepage-project-preview";
import brandMark from "@/assets/mentor-mark.png";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

const demoPreviewKinds: Record<string, ProjectKind> = {
  "demo-campus-companion": "campus",
  "demo-analytics-dashboard": "analytics",
  "demo-project-collaboration": "collaboration",
  "demo-research-paper-workspace": "research",
};

const demoProjectBadges: Record<string, { label: string; tone: string }> = {
  "demo-campus-companion": { label: "Mostly purchased", tone: "popular" },
  "demo-analytics-dashboard": { label: "Trending", tone: "trending" },
  "demo-project-collaboration": { label: "New technology", tone: "new-tech" },
  "demo-research-paper-workspace": { label: "Highly recommended", tone: "recommended" },
};

const technologyColors: Record<string, string> = {
  react: "#1a73e8",
  typescript: "#185abc",
  supabase: "#188038",
  recharts: "#9334e6",
  "node.js": "#188038",
  postgresql: "#b06000",
  python: "#185abc",
  fastapi: "#00897b",
};

const COOKIE_CONSENT_KEY = "project-helper-cookie-consent";

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
  const [motionReady, setMotionReady] = useState(false);
  const [showCookieNotice, setShowCookieNotice] = useState(false);
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
      priceMinor: 0,
      isAvailable: false,
      demo: true,
    },
    {
      id: "demo-analytics-dashboard",
      title: "Analytics Dashboard",
      description: "Explore clear charts and useful metrics in a responsive analytics workspace.",
      techStack: "React · TypeScript · Recharts",
      priceMinor: 0,
      isAvailable: false,
      demo: true,
    },
    {
      id: "demo-project-collaboration",
      title: "Project Collaboration",
      description: "Organize tasks, share updates, and keep a small team moving together.",
      techStack: "React · Node.js · PostgreSQL",
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
      priceMinor: 0,
      isAvailable: false,
      demo: true,
    },
  ];
  const catalogPreview =
    listings.length > 0
      ? listings.slice(0, 3).map((listing) => ({ ...listing, demo: false }))
      : demoProjects;
  const { session } = useAuth();
  const getStarted = session ? "/welcome" : "/auth";
  const signup = session ? {} : { mode: "signup" as const };
  const products = session ? "/premade" : "/auth";
  const productSearch = session ? {} : { mode: "signup" as const };

  useEffect(() => {
    setMotionReady(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = document.querySelectorAll<HTMLElement>(".landing-scroll-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setShowCookieNotice(window.localStorage.getItem(COOKIE_CONSENT_KEY) === null);
  }, []);

  const saveCookiePreference = (preference: "accepted" | "declined") => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, preference);
    setShowCookieNotice(false);
  };

  return (
    <div className={`landing-editorial min-h-screen bg-[#f3f6fb] text-[#111111] selection:bg-[#d4f5df] selection:text-[#111111]${motionReady ? " landing-motion-ready" : ""}`}>
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
            <div className="landing-scroll-reveal text-center lg:text-left">
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
            <div className="landing-scroll-reveal landing-scroll-reveal--delay">
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
            <div className="landing-scroll-reveal max-w-3xl">
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
                  art: "idea",
                  title: "I have an idea",
                  description:
                    "For a college assignment or a professional goal, start with a short description. We’ll help turn it into a project plan.",
                  action: "Shape my idea",
                },
                {
                  number: "02",
                  art: "brief",
                  title: "I have a job description",
                  description:
                    "Use the role’s skills and requirements to shape a relevant project you can build and discuss in interviews.",
                  action: "Use a job description",
                },
                {
                  number: "03",
                  art: "discover",
                  title: "Suggest an idea for me",
                  description:
                    "Choose a domain and let AI suggest a project that fits what you want to learn or demonstrate.",
                  action: "Explore project ideas",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="landing-choice landing-scroll-reveal group relative flex min-h-56 flex-col px-5 py-7 transition-colors duration-200 sm:px-7 sm:py-8 md:min-h-60"
                >
                  <div className="mb-3 flex min-h-[5.25rem] items-start justify-between gap-4">
                    <span className="font-mono text-xs tracking-[.14em] text-[#6c7d95]">
                      {item.number}
                    </span>
                    <div className={`landing-choice__art landing-choice__art--${item.art}`} aria-hidden="true">
                      {item.art === "idea" ? (
                        <svg viewBox="0 0 132 84" fill="none">
                          <path className="landing-choice__orbit" d="M13 57c18-34 45 21 66-14s31-20 40-4" />
                          <rect x="22" y="17" width="72" height="49" rx="10" fill="white" stroke="#dce5f2" />
                          <path d="M34 32h37M34 41h27M34 50h32" stroke="#9aabc0" strokeWidth="2.5" strokeLinecap="round" />
                          <circle cx="92" cy="19" r="7" fill="#4285f4" />
                          <circle cx="111" cy="58" r="5" fill="#34a853" />
                          <circle cx="15" cy="57" r="4" fill="#fbbc04" />
                        </svg>
                      ) : item.art === "brief" ? (
                        <svg viewBox="0 0 132 84" fill="none">
                          <rect x="31" y="8" width="58" height="68" rx="9" fill="white" stroke="#dce5f2" />
                          <rect x="42" y="20" width="21" height="5" rx="2.5" fill="#4285f4" />
                          <path d="M42 34h36M42 43h29M42 52h36M42 61h22" stroke="#a6b4c6" strokeWidth="2.5" strokeLinecap="round" />
                          <circle cx="99" cy="20" r="7" fill="#ea4335" />
                          <circle cx="106" cy="49" r="5" fill="#fbbc04" />
                          <circle cx="19" cy="63" r="6" fill="#34a853" />
                          <path d="M19 63h12M89 20h3M89 49h12" stroke="#8fa4c0" strokeWidth="1.5" strokeDasharray="2 3" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 132 84" fill="none">
                          <ellipse cx="68" cy="43" rx="45" ry="22" stroke="#d4deed" strokeWidth="1.5" />
                          <ellipse cx="68" cy="43" rx="45" ry="22" transform="rotate(-35 68 43)" stroke="#d4deed" strokeWidth="1.5" />
                          <path d="m38 55 27-22 31 19M65 33l25-9" stroke="#9cafc8" strokeWidth="1.5" strokeDasharray="3 4" />
                          <circle cx="38" cy="55" r="7" fill="#34a853" />
                          <circle cx="65" cy="33" r="8" fill="#4285f4" />
                          <circle cx="96" cy="52" r="6" fill="#fbbc04" />
                          <circle cx="90" cy="24" r="5" fill="#ea4335" />
                        </svg>
                      )}
                    </div>
                  </div>
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
                    className="landing-product-card landing-scroll-reveal flex min-w-0 flex-col overflow-hidden rounded-2xl transition duration-200 hover:-translate-y-1"
                  >
                    <div className="landing-product-card__visual">
                      {product.demo ? (
                        <HomepageProjectPreview
                          kind={demoPreviewKinds[product.id] ?? "campus"}
                          title={product.title}
                        />
                      ) : product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={`Preview image for ${product.title}`}
                          loading="lazy"
                          className="aspect-[16/10] w-full border-b border-[#e4e4e7] object-cover"
                        />
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
                      {product.demo && demoProjectBadges[product.id] ? (
                        <span
                          className={`landing-product-badge landing-product-badge--${demoProjectBadges[product.id].tone}`}
                        >
                          {demoProjectBadges[product.id].label}
                        </span>
                      ) : null}
                    </div>
                    <div className="landing-product-card__body flex flex-1 flex-col p-4 sm:p-5">
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-semibold leading-tight tracking-[-.035em] sm:text-[1.35rem]">
                          {product.title}
                        </h3>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm leading-5 text-[#525866]">
                        {product.description}
                      </p>
                      <div className="landing-product-card__details mt-3 border-t border-[#e8eaed] pt-3">
                        <div className="landing-product-includes flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] font-medium">
                          <span className="shrink-0 text-[0.62rem] font-semibold uppercase tracking-[.08em] text-[#73777d]">
                            Includes
                          </span>
                          <span>Research paper</span>
                          <span>Code</span>
                          <span>Documentation</span>
                        </div>
                        <p className="landing-product-card__stack mt-2 text-xs text-[#65748a]">
                          <span className="mr-2 font-semibold uppercase tracking-wide text-[#718096]">Stack</span>
                          {product.techStack.split(/[·,]/).map((technology, index) => {
                            const name = technology.trim();
                            const color = technologyColors[name.toLowerCase()];
                            return (
                              <span key={name}>
                                {index > 0 ? <span className="px-1 text-[#9aa0a6]">·</span> : null}
                                <span className="font-medium" style={color ? { color } : undefined}>
                                  {name}
                                </span>
                              </span>
                            );
                          })}
                        </p>
                      </div>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                        <div>
                          <p className="text-xs text-[#62666e]">
                            {product.demo ? "Concept preview" : product.isAvailable ? "One-time purchase" : "Currently unavailable"}
                          </p>
                          {product.isAvailable && !product.demo ? (
                            <p className="mt-1 text-lg font-semibold text-[#111111] sm:text-xl">
                              ₹{(product.priceMinor / 100).toLocaleString("en-IN")}
                            </p>
                          ) : null}
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
        <section
          id="faq"
          aria-labelledby="landing-faq-title"
          className="landing-faq border-b px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
        >
          <div className="mx-auto grid max-w-[90rem] gap-10 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] lg:gap-24">
            <div className="landing-scroll-reveal">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#1a73e8]">FAQ</p>
              <h2
                id="landing-faq-title"
                className="mt-4 max-w-md font-display text-4xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-[3.25rem]"
              >
                Frequently asked questions
              </h2>
              <p className="mt-4 max-w-sm text-base leading-7 text-[#5f6368]">
                A few quick answers about turning a starting point into a project you can build and share.
              </p>
            </div>
            <div className="landing-faq__list landing-scroll-reveal">
              <details className="landing-faq__item" open>
                <summary>What can I start with?</summary>
                <p>Bring a job description, a college project idea, or a professional goal. If you are not sure what to build, ask AI to suggest an idea for a domain you choose.</p>
              </details>
              <details className="landing-faq__item">
                <summary>What will Project Helper help me create?</summary>
                <p>You get a clear project plan with guidance for defining the problem, setting up files, building, validating, and documenting your work.</p>
              </details>
              <details className="landing-faq__item">
                <summary>Do I need to be an experienced developer?</summary>
                <p>No. The project is broken into manageable steps, with explanations to help you understand what you are building as you go.</p>
              </details>
              <details className="landing-faq__item">
                <summary>Can I start from a ready-made project?</summary>
                <p>Yes. Browse the ready-made projects to find a starting point, then make it your own. Availability is shown on each project.</p>
              </details>
            </div>
          </div>
        </section>
      </main>
      <Footer
        getStarted={getStarted}
        signup={signup}
        products={products}
        productSearch={productSearch}
      />
      {showCookieNotice && <CookieNotice onChoice={saveCookiePreference} />}
    </div>
  );
}

function CookieNotice({
  onChoice,
}: {
  onChoice: (preference: "accepted" | "declined") => void;
}) {
  return (
    <section
      className="landing-cookie-notice"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-description"
    >
      <div className="landing-cookie-notice__content">
        <div>
          <h2 id="cookie-notice-title">Your cookie choice</h2>
          <p id="cookie-notice-description">
            We use essential cookies to keep Project Helper working. You can also allow optional
            cookies that help us improve the website.
          </p>
        </div>
      </div>
      <div className="landing-cookie-notice__footer">
        <Link to="/privacy" className="landing-cookie-notice__policy">
          Read our Privacy Notice
        </Link>
        <div className="landing-cookie-notice__actions">
          <Button
            type="button"
            variant="outline"
            className="landing-cookie-notice__reject"
            onClick={() => onChoice("declined")}
          >
            Do not accept
          </Button>
          <Button
            type="button"
            className="landing-cookie-notice__accept"
            onClick={() => onChoice("accepted")}
          >
            Accept cookies
          </Button>
        </div>
      </div>
    </section>
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
    <header className="landing-header px-5 sm:px-8">
      <div className="landing-header__inner mx-auto flex max-w-[90rem] items-center justify-between gap-5">
        <Link
          to="/"
          className="landing-header__brand flex items-center gap-3 font-display text-lg font-semibold tracking-[-.04em]"
        >
          <img src={brandMark} alt="" className="size-9 rounded-xl object-cover" />
          <span>GetProjectHelper</span>
        </Link>
        <nav aria-label="Main navigation" className="landing-header__nav hidden items-center gap-1 text-sm font-medium md:flex">
          <a href="#services" className="landing-header__link">
            Product
          </a>
          <a href="#how-it-works" className="landing-header__link">
            Resources
          </a>
          <Link to="/pricing" className="landing-header__link">
            Pricing
          </Link>
        </nav>
        <div className="landing-header__actions hidden items-center gap-5 sm:flex">
          {!signedIn && (
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="landing-header__signin text-sm font-semibold"
            >
              Sign in
            </Link>
          )}
          <Link
            to={getStarted}
            search={signup}
            className="landing-header__cta inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-3 text-sm font-semibold text-white transition"
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
    <footer className="landing-footer mx-2 mb-2 rounded-2xl border px-5 py-6 text-[#202124] sm:mx-4 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[90rem]">
        <div className="landing-footer__brandbar border-b border-[#dadce0] pb-5">
          <div>
            <p className="font-display text-lg font-semibold tracking-[-.025em]">GetProjectHelper</p>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#5f6368]">
              From ideas to working solutions. Explore, plan, and build projects with confidence.
            </p>
          </div>
        </div>
        <div className="grid gap-x-8 gap-y-7 border-b border-[#dadce0] py-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-sm font-semibold text-[#202124]">Platform</p>
            <div className="landing-footer__links mt-3 grid justify-items-start gap-1 text-sm text-[#5f6368]">
              <Link to={getStarted} search={signup}>
                Get a Project
              </Link>
              <Link
                to={products}
                search={productSearch}
              >
                Buy a Product
              </Link>
              <a href="/how-it-works">
                How It Works
              </a>
              <a href="/contact">
                Contact Us
              </a>
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-[#202124]">Legal</p>
            <div className="landing-footer__links mt-3 grid justify-items-start gap-1 text-sm text-[#5f6368]">
              <Link to="/privacy">
                Privacy Policy
              </Link>
              <Link to="/terms">
                Terms of Service
              </Link>
              <Link to="/refund-policy">
                Refund Policy
              </Link>
              <a href="/cookie-policy">
                Cookie Policy
              </a>
              <a href="/license-agreement">
                License Agreement
              </a>
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-[#202124]">Trust &amp; Safety</p>
            <div className="landing-footer__links mt-3 grid justify-items-start gap-1 text-sm text-[#5f6368]">
              <a href="/ai-usage-disclaimer">
                AI Usage Disclaimer
              </a>
              <a href="/data-protection">
                Data Protection
              </a>
              <a href="/acceptable-use">
                Acceptable Use
              </a>
              <a href="/security">
                Security
              </a>
              <a href="/report-an-issue">
                Report an Issue
              </a>
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-[#202124]">Company &amp; Support</p>
            <div className="landing-footer__links mt-3 grid justify-items-start gap-1 text-sm text-[#5f6368]">
              <a href="/about-us">
                About Us
              </a>
              <a href="/help-center">
                Help Center
              </a>
              <a href="/grievance-redressal">
                Grievance Redressal
              </a>
              <a href="/contact">
                Contact
              </a>
              <a href="/accessibility">
                Accessibility
              </a>
            </div>
          </div>
        </div>
        <div
          id="ai-usage-disclaimer"
          className="border-b border-[#dadce0] py-4 text-center text-sm leading-6 text-[#5f6368]"
        >
          <p>AI can make mistakes. Please verify important information before relying on it.</p>
        </div>
        <div className="pt-4 text-xs text-[#5f6368]">
          <span>© 2026 GetProjectHelper. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
