import brandMark from "@/assets/mentor-mark.png";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ClipboardList,
  Code2,
  FileCheck2,
  Lightbulb,
  Menu,
  MessageSquareText,
  Presentation,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { HeaderAccountMenu } from "@/components/header-account-menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Helper | Build or Buy Your Next Project" },
      {
        name: "description",
        content:
          "Build a project from an idea or discover ready-made projects to buy. Project Helper brings project planning, expert support and a curated project marketplace together.",
      },
      { property: "og:title", content: "Project Helper | Build or Buy Your Next Project" },
      {
        property: "og:description",
        content:
          "Build a project with expert support or discover a ready-made project that fits your goals.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://getprojecthelper.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://getprojecthelper.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Project Helper",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          description:
            "A project marketplace and workspace for people building projects or looking for ready-made projects to buy.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: Landing,
});

const marketplaceProjects = [
  {
    title: "Analytics dashboard",
    image: "/analytics-dashboard-project.png",
    stack: ["React", "TypeScript", "Charts"],
    description: "A polished dashboard for turning data into clear insights.",
    price: "$79",
  },
  {
    title: "Campus event planner",
    image: "/student-project-workspace.png",
    stack: ["React", "Node.js", "PostgreSQL"],
    description: "Plan, manage and share events with one simple workspace.",
    price: "$69",
  },
  {
    title: "Project research toolkit",
    image: "/project-collaboration.png",
    stack: ["Python", "Pandas", "Jupyter"],
    description: "Organise research, explore data and document your findings.",
    price: "$59",
  },
];

function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % 2), 5200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-violet-500/25 via-sky-500/20 to-emerald-500/15 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#14151c] p-2 shadow-[0_28px_70px_rgba(0,0,0,.45)]">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          <section className="w-full shrink-0 rounded-[1.55rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-white">
                Build a project
              </span>
              <Code2 className="size-5 text-white/80" />
            </div>
            <h2 className="mt-8 font-display text-3xl font-bold tracking-[-.05em] text-white">
              Turn an idea into a clear roadmap.
            </h2>
            <div className="mt-7 space-y-3">
              {[
                ["01", "Choose your project idea"],
                ["02", "Get your step by step roadmap"],
                ["03", "Build with guidance"],
              ].map(([number, text]) => (
                <div
                  key={number}
                  className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/15 p-3.5 text-sm font-medium text-white"
                >
                  <span className="grid size-7 place-items-center rounded-lg bg-white text-xs font-bold text-violet-700">
                    {number}
                  </span>
                  {text}
                  <Check className="ml-auto size-4 text-emerald-300" />
                </div>
              ))}
            </div>
          </section>
          <section className="w-full shrink-0 rounded-[1.55rem] bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-white">
                Buy a project
              </span>
              <BriefcaseBusiness className="size-5 text-white/80" />
            </div>
            <h2 className="mt-8 font-display text-3xl font-bold tracking-[-.05em] text-white">
              Find a project that fits your goal.
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                ["Data dashboard", "Ready to customise"],
                ["Business website", "Project files included"],
                ["Portfolio app", "Built for showcasing"],
                ["Research toolkit", "Structured and documented"],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-xl border border-white/15 bg-black/15 p-3.5">
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-1 text-xs text-white/70">{detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-white/15 bg-black/30 p-2 backdrop-blur">
          {["Build project", "Buy project"].map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveSlide(index)}
              className={
                "h-2 rounded-full transition-all " +
                (activeSlide === index ? "w-7 bg-white" : "w-2 bg-white/45 hover:bg-white/75")
              }
              aria-label={label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const { session, loading } = useAuth();
  const workspace = session ? "/welcome" : "/auth";
  const nav = [
    ["Build a project", "#build-project"],
    ["Find projects", "#projects"],
    ["AI guidance", "#mentor"],
  ] as const;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#09090b] text-white">
      <div className="landing-wash-dark pointer-events-none fixed inset-0 -z-10" aria-hidden />
      <header className="relative z-30 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111218]/75 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,.28)] backdrop-blur-xl sm:px-5">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5 font-display text-base font-bold tracking-[-0.04em] sm:text-lg"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-300/60">
              <img src={brandMark} alt="" width={512} height={512} className="size-5" />
            </span>
            <span className="truncate">Project Helper</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex">
            {nav.map(([label, href]) => (
              <a key={href} href={href} className="transition-colors hover:text-violet-300">
                {label}
              </a>
            ))}
            <Link to="/pricing" className="transition-colors hover:text-violet-300">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {!loading &&
              (session ? (
                <HeaderAccountMenu />
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
                  >
                    <Link to="/auth">Log in</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="hidden rounded-xl bg-white px-4 text-slate-950 shadow-lg shadow-black/30 hover:bg-violet-100 sm:inline-flex"
                  >
                    <Link to="/auth" search={{ mode: "signup" }}>
                      Get started
                    </Link>
                  </Button>
                </>
              ))}
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(22rem,88vw)]">
                <SheetTitle>Project Helper</SheetTitle>
                <nav className="mt-8 flex flex-col gap-1">
                  {nav.map(([label, href]) => (
                    <SheetClose key={href} asChild>
                      <a
                        href={href}
                        className="rounded-xl px-3 py-3 font-medium hover:bg-violet-50"
                      >
                        {label}
                      </a>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      to="/pricing"
                      className="rounded-xl px-3 py-3 font-medium hover:bg-violet-50"
                    >
                      Pricing
                    </Link>
                  </SheetClose>
                </nav>
                <Button asChild className="mt-8 w-full rounded-xl bg-slate-950">
                  <Link to={workspace}>{session ? "Open workspace" : "Get started free"}</Link>
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-5 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-200 shadow-sm">
                <Sparkles className="size-3.5" /> Build it yourself or find the right project
              </div>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[.98] tracking-[-.065em] text-white sm:text-6xl xl:text-7xl">
                Your next big project is{" "}
                <span className="landing-gradient-text">closer than you think.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Bring an idea to life with a clear plan and expert support, or discover a ready-made
                project you can buy and make your own.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="group h-13 rounded-xl bg-white px-6 text-base text-slate-950 shadow-xl shadow-black/30 transition hover:bg-violet-100"
                >
                  <Link to={workspace} search={session ? undefined : { mode: "signup" }}>
                    Build a project{" "}
                    <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-13 rounded-xl border-white/20 bg-white/5 px-6 text-base text-white hover:bg-white/10 hover:text-white"
                >
                  <a href="#projects">Browse projects to buy</a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-300">
                {[
                  "Build with expert guidance",
                  "Discover ready-made projects",
                  "Clear project ownership",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <HeroCarousel />
          </div>
        </section>
        <section
          id="build-project"
          className="build-project-section border-y border-white/10 px-5 py-20 sm:px-6 sm:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">
                  Build project
                </p>
                <h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-[1.04] tracking-[-.055em] text-white sm:text-5xl">
                  Build a project.
                </h2>
              </div>
              <p className="max-w-xl text-lg leading-8 text-slate-300 lg:justify-self-end">
                Choose how you want to start.
              </p>
            </div>
            <div className="mt-8 max-w-4xl rounded-2xl border border-white/10 bg-white/[.035] p-5 text-sm leading-7 text-slate-300 sm:p-6">
              <p>
                <span className="font-semibold text-white">Here is how it works:</span> tell us your
                idea, ask AI for suggestions, or share a job description. Project Helper then
                creates a clear roadmap and helps you complete each stage, from planning and setup
                to testing, documentation and presentation.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.045] p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-300/45 hover:bg-white/[.07] hover:shadow-[0_18px_45px_rgba(76,29,149,.2)]">
                <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-violet-400/10 transition group-hover:bg-violet-400/20" />
                <span className="relative flex size-11 items-center justify-center rounded-xl bg-violet-400/15 text-violet-200">
                  <Lightbulb className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold tracking-[-.035em] text-white">
                  I have an idea
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Get a custom roadmap.</p>
                <Button
                  asChild
                  variant="link"
                  className="mt-5 h-auto px-0 text-violet-200 hover:text-white"
                >
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Start here{" "}
                    <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </article>
              <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.045] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/45 hover:bg-white/[.07] hover:shadow-[0_18px_45px_rgba(8,145,178,.2)]">
                <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-cyan-400/10 transition group-hover:bg-cyan-400/20" />
                <span className="relative flex size-11 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200">
                  <Sparkles className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold tracking-[-.035em] text-white">
                  Suggest an idea
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Let AI choose a direction.</p>
                <Button
                  asChild
                  variant="link"
                  className="mt-5 h-auto px-0 text-cyan-200 hover:text-white"
                >
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Get ideas{" "}
                    <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </article>
              <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.045] p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/45 hover:bg-white/[.07] hover:shadow-[0_18px_45px_rgba(5,150,105,.2)]">
                <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-emerald-400/10 transition group-hover:bg-emerald-400/20" />
                <span className="relative flex size-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
                  <BriefcaseBusiness className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold tracking-[-.035em] text-white">
                  Use a job description
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Turn a role into a project.</p>
                <Button
                  asChild
                  variant="link"
                  className="mt-5 h-auto px-0 text-emerald-200 hover:text-white"
                >
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Use a role{" "}
                    <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </article>
            </div>
            <ProjectWorkflow />
          </div>
        </section>
        <section
          id="projects"
          className="relative border-y border-white/10 bg-white/[.025] px-5 py-20 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">
                Project marketplace
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-.05em] text-white sm:text-5xl">
                Explore projects ready to make your own.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                Browse practical projects with clear technology, details and pricing.
              </p>
            </div>
            <div className="mt-11 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {marketplaceProjects.map(({ title, image, stack, description, price }) => (
                <article
                  key={title}
                  className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#14151c] shadow-[0_18px_45px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-1 hover:border-violet-300/35 hover:shadow-[0_25px_55px_rgba(76,29,149,.2)]"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={image}
                      alt={title}
                      className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      Ready to explore
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-xl font-bold tracking-[-.04em] text-white">
                        {title}
                      </h3>
                      <span className="shrink-0 text-lg font-bold text-emerald-300">{price}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {stack.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-slate-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <Button
                        asChild
                        variant="outline"
                        className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                      >
                        <Link to="/auth" search={{ mode: "signup" }}>
                          Explore
                        </Link>
                      </Button>
                      <Button asChild className="bg-white text-slate-950 hover:bg-violet-100">
                        <Link to="/auth" search={{ mode: "signup" }}>
                          Get project <ArrowRight className="ml-1 size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="how-it-works" className="px-5 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">
                How it works
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-.05em] sm:text-5xl">
                Two clear ways to get your project moving.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                [
                  "01",
                  "Choose your route",
                  "Start building from your own idea or browse projects already available.",
                ],
                [
                  "02",
                  "Make it fit your goals",
                  "Use a clear plan, project details and expert support to make informed decisions.",
                ],
                [
                  "03",
                  "Move forward with confidence",
                  "Build, buy or adapt a project with everything organised in one place.",
                ],
              ].map(([number, title, text]) => (
                <div
                  key={number}
                  className="rounded-3xl border border-violet-100 bg-white/75 p-7 shadow-sm"
                >
                  <span className="font-display text-5xl font-bold tracking-[-.08em] text-violet-300">
                    {number}
                  </span>
                  <h3 className="mt-10 font-display text-xl font-bold tracking-[-.04em]">
                    {title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="mentor" className="px-5 pb-20 sm:px-6 sm:pb-28">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 text-white lg:grid-cols-[.95fr_1.05fr]">
            <div className="p-8 sm:p-12">
              <span className="inline-grid size-11 place-items-center rounded-xl bg-white/10">
                <MessageSquareText className="size-5 text-violet-300" />
              </span>
              <p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-violet-300">
                Your AI project mentor
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-[-.05em] sm:text-4xl">
                Answers that stay grounded in your actual work.
              </h2>
              <p className="mt-5 max-w-md leading-7 text-slate-300">
                Ask about your plan, code, research or presentation. Get practical help that keeps
                your thinking clear and your project moving.
              </p>
              <Button
                asChild
                className="mt-8 rounded-xl bg-white text-slate-950 hover:bg-violet-100"
              >
                <Link to={workspace}>
                  Meet your mentor <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
            <div className="m-5 rounded-[1.5rem] bg-gradient-to-br from-violet-500 to-indigo-600 p-5 sm:m-8 sm:p-7">
              <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
                <p className="text-xs font-bold text-violet-700">YOU</p>
                <p className="mt-2 text-sm leading-6">
                  How can I make my final presentation more convincing?
                </p>
              </div>
              <div className="mt-4 rounded-2xl bg-slate-950 p-5 shadow-xl">
                <p className="text-xs font-bold text-violet-300">PROJECT HELPER</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Lead with the problem you solved, then show one clear decision from your project
                  and the evidence behind it. That gives your audience a story they can follow.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 bg-black/20 px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
          <span>© 2026 Sizcon Studios</span>
          <div className="flex gap-5">
            <Link to="/terms" className="hover:text-violet-300">
              Terms
            </Link>
            <Link to="/refund-policy" className="hover:text-violet-300">
              Refund policy
            </Link>
            <Link to="/privacy" className="hover:text-violet-300">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const PROJECT_STAGES = [
  { icon: Lightbulb, title: "Choose an idea", detail: "Tell us what you want to build." },
  {
    icon: Target,
    title: "Define the problem",
    detail: "We define the problem your project will solve.",
  },
  { icon: ClipboardList, title: "Set up", detail: "We find the data, tools and folders you need." },
  { icon: Code2, title: "Build", detail: "Follow guided tasks to create each part." },
  {
    icon: ShieldCheck,
    title: "Validate",
    detail: "Test your project and improve anything that needs work.",
  },
  {
    icon: FileCheck2,
    title: "Document",
    detail: "Create clear reports that explain your project.",
  },
  {
    icon: Presentation,
    title: "Present",
    detail: "Prepare slides and practise common project questions.",
  },
  { icon: Rocket, title: "Share", detail: "Package your project and show it to others." },
];

function ProjectWorkflow() {
  return (
    <div className="mt-14 border-t border-white/10 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">
            Your roadmap
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-[-.04em] text-white">
            What happens next
          </h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
          8 simple steps
        </span>
      </div>
      <div className="relative mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 xl:gap-3">
        <div
          className="absolute left-[6%] right-[6%] top-[3.8rem] hidden h-px bg-gradient-to-r from-violet-500/70 via-cyan-300/40 to-violet-500/70 xl:block"
          aria-hidden
        />
        {PROJECT_STAGES.map(({ icon: Icon, title, detail }, index) => (
          <article key={title} className="relative text-center xl:text-left">
            <span className="mb-3 block text-[10px] font-bold tracking-[.16em] text-slate-500">
              STEP {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className={
                "relative z-10 mx-auto flex size-14 items-center justify-center rounded-2xl border xl:mx-0 " +
                (index === 3
                  ? "border-violet-300 bg-violet-500 text-white shadow-[0_0_30px_rgba(139,92,246,.45)]"
                  : "border-white/15 bg-white/[.06] text-violet-200")
              }
            >
              <Icon className="size-5" />
            </span>
            <p className="mt-4 text-sm font-bold text-white">{title}</p>
            <p className="mx-auto mt-2 max-w-[12rem] text-sm leading-6 text-slate-400 xl:mx-0">
              {detail}
            </p>
          </article>
        ))}
      </div>
      <div className="mt-10 grid gap-4 rounded-2xl border border-white/10 bg-white/[.045] p-5 sm:grid-cols-[1.2fr_.8fr_auto] sm:items-center sm:p-6">
        <div>
          <p className="text-sm font-semibold text-white">
            You do not have to figure everything out alone.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            At every stage, you can see what to do next, keep your project files organised, and ask
            for guidance when you are stuck.
          </p>
        </div>
        <div className="border-t border-white/10 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-violet-300">
            What you get
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            A roadmap, clear tasks, project files, documents and presentation support.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="shrink-0 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
        >
          <Link to="/auth" search={{ mode: "signup" }}>
            Start building <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
