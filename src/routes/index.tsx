import brandMark from "@/assets/mentor-mark.png";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpen, BriefcaseBusiness, Check, ClipboardList, Code2, FileCheck2, FileText, GraduationCap, Lightbulb, Menu, MessageSquareText, Presentation, Rocket, ShieldCheck, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeaderAccountMenu } from "@/components/header-account-menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Helper | Build or Buy Your Next Project" },
      { name: "description", content: "Build a project from an idea or discover ready-made projects to buy. Project Helper brings project planning, expert support and a curated project marketplace together." },
      { property: "og:title", content: "Project Helper | Build or Buy Your Next Project" },
      { property: "og:description", content: "Build a project with expert support or discover a ready-made project that fits your goals." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://getprojecthelper.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://getprojecthelper.com/" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({
      "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Project Helper",
      applicationCategory: "EducationalApplication", operatingSystem: "Web",
      description: "A project marketplace and workspace for people building projects or looking for ready-made projects to buy.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    }) }],
  }),
  component: Landing,
});

const categories = [
  { icon: Code2, title: "Software projects", text: "Plan features, write cleaner code and ship with confidence.", tone: "from-sky-100 via-cyan-50 to-blue-100", iconTone: "bg-blue-600" },
  { icon: BookOpen, title: "Research & analysis", text: "Turn questions, datasets and findings into a clear story.", tone: "from-violet-100 via-fuchsia-50 to-purple-100", iconTone: "bg-violet-600" },
  { icon: BriefcaseBusiness, title: "Business projects", text: "Build practical plans, market research and polished proposals.", tone: "from-amber-100 via-orange-50 to-rose-100", iconTone: "bg-orange-500" },
  { icon: FileText, title: "Reports & documentation", text: "Structure every section and make your evidence easy to follow.", tone: "from-emerald-100 via-teal-50 to-cyan-100", iconTone: "bg-teal-600" },
  { icon: Target, title: "Final-year projects", text: "Stay organised from a first proposal through to your viva.", tone: "from-rose-100 via-pink-50 to-fuchsia-100", iconTone: "bg-pink-600" },
  { icon: GraduationCap, title: "Portfolio-ready work", text: "Present the thinking behind your work, not just the final result.", tone: "from-lime-100 via-green-50 to-emerald-100", iconTone: "bg-emerald-600" },
];

function Landing() {
  const { session, loading } = useAuth();
  const workspace = session ? "/welcome" : "/auth";
  const nav = [["Build a project", "#build-project"], ["Find projects", "#projects"], ["AI guidance", "#mentor"]] as const;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#09090b] text-white">
      <div className="landing-wash-dark pointer-events-none fixed inset-0 -z-10" aria-hidden />
      <header className="relative z-30 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111218]/75 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,.28)] backdrop-blur-xl sm:px-5">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 font-display text-base font-bold tracking-[-0.04em] sm:text-lg">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-300/60"><img src={brandMark} alt="" width={512} height={512} className="size-5" /></span>
            <span className="truncate">Project Helper</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex">
            {nav.map(([label, href]) => <a key={href} href={href} className="transition-colors hover:text-violet-300">{label}</a>)}
            <Link to="/pricing" className="transition-colors hover:text-violet-300">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            {!loading && (session ? <HeaderAccountMenu /> : <><Button asChild variant="ghost" size="sm" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"><Link to="/auth">Log in</Link></Button><Button asChild size="sm" className="hidden rounded-xl bg-white px-4 text-slate-950 shadow-lg shadow-black/30 hover:bg-violet-100 sm:inline-flex"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button></>)}
            <Sheet><SheetTrigger asChild><Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open menu"><Menu className="size-5" /></Button></SheetTrigger><SheetContent side="right" className="w-[min(22rem,88vw)]"><SheetTitle>Project Helper</SheetTitle><nav className="mt-8 flex flex-col gap-1">{nav.map(([label, href]) => <SheetClose key={href} asChild><a href={href} className="rounded-xl px-3 py-3 font-medium hover:bg-violet-50">{label}</a></SheetClose>)}<SheetClose asChild><Link to="/pricing" className="rounded-xl px-3 py-3 font-medium hover:bg-violet-50">Pricing</Link></SheetClose></nav><Button asChild className="mt-8 w-full rounded-xl bg-slate-950"><Link to={workspace}>{session ? "Open workspace" : "Get started free"}</Link></Button></SheetContent></Sheet>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-5 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-200 shadow-sm"><Sparkles className="size-3.5" /> Build it yourself or find the right project</div>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[.98] tracking-[-.065em] text-white sm:text-6xl xl:text-7xl">Your next big project is <span className="landing-gradient-text">closer than you think.</span></h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Bring an idea to life with a clear plan and expert support, or discover a ready-made project you can buy and make your own.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="group h-13 rounded-xl bg-white px-6 text-base text-slate-950 shadow-xl shadow-black/30 transition hover:bg-violet-100"><Link to={workspace} search={session ? undefined : { mode: "signup" }}>Build a project <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" /></Link></Button><Button asChild size="lg" variant="outline" className="h-13 rounded-xl border-white/20 bg-white/5 px-6 text-base text-white hover:bg-white/10 hover:text-white"><a href="#projects">Browse projects to buy</a></Button></div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-300">{["Build with expert guidance", "Discover ready-made projects", "Clear project ownership"].map((item) => <span key={item} className="flex items-center gap-2"><Check className="size-4 text-emerald-400" />{item}</span>)}</div>
            </div>
            <div className="relative mx-auto w-full max-w-xl"><div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-violet-500/25 via-sky-500/20 to-emerald-500/15 blur-3xl" /><div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#14151c] p-2 shadow-[0_28px_70px_rgba(0,0,0,.45)]"><img src="/student-project-workspace.png" alt="Student planning a project in a university library" className="aspect-[1.32/1] w-full rounded-[1.55rem] object-cover" /><div className="absolute bottom-6 left-6 rounded-2xl border border-white/15 bg-black/65 p-4 backdrop-blur-md"><p className="text-xs font-bold uppercase tracking-[.14em] text-violet-200">Project planning</p><p className="mt-1 text-sm font-semibold text-white">A clear next step, every time.</p></div></div></div>
          </div>
        </section>
        <section id="build-project" className="build-project-section border-y border-white/10 px-5 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Build project</p>
                <h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-[1.04] tracking-[-.055em] text-white sm:text-5xl">Build your project, step by step.</h2>
              </div>
              <p className="max-w-xl text-lg leading-8 text-slate-300 lg:justify-self-end">See your idea become a finished project, step by step.</p>
            </div>
            <ProjectWorkflow />
          </div>
        </section>
        <section id="projects" className="relative border-y border-white/70 bg-white/45 px-5 py-20 sm:px-6 sm:py-24"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-violet-700">Project marketplace</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-.05em] sm:text-5xl">Find the right project or build one from the ground up.</h2><p className="mt-4 text-lg leading-8 text-slate-600">Explore ready-made project types to buy, or choose a direction for the project you want to create.</p></div><div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map(({ icon: Icon, title, text, tone, iconTone }) => <article key={title} className={"group rounded-[1.6rem] border border-white/80 bg-gradient-to-br " + tone + " p-6 shadow-[0_12px_30px_rgba(75,68,140,.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(75,68,140,.16)]"}><div className={"grid size-11 place-items-center rounded-xl text-white shadow-lg " + iconTone}><Icon className="size-5" /></div><h3 className="mt-9 font-display text-xl font-bold tracking-[-.04em]">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">{text}</p><a href="#how-it-works" className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-slate-800 transition group-hover:gap-2">View projects <ArrowRight className="size-4" /></a></article>)}</div></div></section>
        <section id="how-it-works" className="px-5 py-20 sm:px-6 sm:py-28"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">How it works</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-.05em] sm:text-5xl">Two clear ways to get your project moving.</h2></div><div className="mt-12 grid gap-5 md:grid-cols-3">{[["01", "Choose your route", "Start building from your own idea or browse projects already available."], ["02", "Make it fit your goals", "Use a clear plan, project details and expert support to make informed decisions."], ["03", "Move forward with confidence", "Build, buy or adapt a project with everything organised in one place."]].map(([number, title, text]) => <div key={number} className="rounded-3xl border border-violet-100 bg-white/75 p-7 shadow-sm"><span className="font-display text-5xl font-bold tracking-[-.08em] text-violet-300">{number}</span><h3 className="mt-10 font-display text-xl font-bold tracking-[-.04em]">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></div>)}</div></div></section>
        <section id="mentor" className="px-5 pb-20 sm:px-6 sm:pb-28"><div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 text-white lg:grid-cols-[.95fr_1.05fr]"><div className="p-8 sm:p-12"><span className="inline-grid size-11 place-items-center rounded-xl bg-white/10"><MessageSquareText className="size-5 text-violet-300" /></span><p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-violet-300">Your AI project mentor</p><h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-[-.05em] sm:text-4xl">Answers that stay grounded in your actual work.</h2><p className="mt-5 max-w-md leading-7 text-slate-300">Ask about your plan, code, research or presentation. Get practical help that keeps your thinking clear and your project moving.</p><Button asChild className="mt-8 rounded-xl bg-white text-slate-950 hover:bg-violet-100"><Link to={workspace}>Meet your mentor <ArrowRight className="ml-2 size-4" /></Link></Button></div><div className="m-5 rounded-[1.5rem] bg-gradient-to-br from-violet-500 to-indigo-600 p-5 sm:m-8 sm:p-7"><div className="rounded-2xl bg-white p-5 text-slate-900 shadow-xl"><p className="text-xs font-bold text-violet-700">YOU</p><p className="mt-2 text-sm leading-6">How can I make my final presentation more convincing?</p></div><div className="mt-4 rounded-2xl bg-slate-950 p-5 shadow-xl"><p className="text-xs font-bold text-violet-300">PROJECT HELPER</p><p className="mt-2 text-sm leading-6 text-slate-200">Lead with the problem you solved, then show one clear decision from your project and the evidence behind it. That gives your audience a story they can follow.</p></div></div></div></section>
      </main>
      <footer className="border-t border-white/10 bg-black/20 px-5 py-8 sm:px-6"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-slate-400"><span>© 2026 Sizcon Studios</span><div className="flex gap-5"><Link to="/terms" className="hover:text-violet-300">Terms</Link><Link to="/refund-policy" className="hover:text-violet-300">Refund policy</Link><Link to="/privacy" className="hover:text-violet-300">Privacy</Link></div></div></footer>
    </div>
  );
}

const PROJECT_STAGES = [
  { icon: Lightbulb, title: "Choose an idea", detail: "Choose a project idea or start with your own." },
  { icon: ClipboardList, title: "Make a plan", detail: "Make a simple plan before you begin." },
  { icon: Code2, title: "Build your project", detail: "Build each part with guided support." },
  { icon: ShieldCheck, title: "Check your work", detail: "Check your work and fix what needs attention." },
  { icon: FileCheck2, title: "Add your documents", detail: "Create clear notes, reports and project files." },
  { icon: Presentation, title: "Prepare to present", detail: "Prepare a simple story for your project." },
  { icon: Rocket, title: "Share your project", detail: "Share your finished project with confidence." },
];

function ProjectWorkflow() {
  return (
    <div className="mt-14">
      <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-7 lg:gap-3">
        <div className="absolute left-[7%] right-[7%] top-7 hidden h-px bg-gradient-to-r from-violet-500/70 via-cyan-300/40 to-violet-500/70 lg:block" aria-hidden />
        {PROJECT_STAGES.map(({ icon: Icon, title, detail }, index) => (
          <article key={title} className="relative text-center lg:text-left">
            <span className={"relative z-10 mx-auto flex size-14 items-center justify-center rounded-2xl border lg:mx-0 " + (index === 2 ? "border-violet-300 bg-violet-500 text-white shadow-[0_0_30px_rgba(139,92,246,.45)]" : "border-white/15 bg-white/[.06] text-violet-200")}>
              <Icon className="size-5" />
            </span>
            <p className="mt-5 text-sm font-bold text-white">{title}</p>
            <p className="mx-auto mt-2 max-w-[11rem] text-sm leading-6 text-slate-400 lg:mx-0">{detail}</p>
          </article>
        ))}
      </div>
      <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[.045] p-5 shadow-[0_18px_45px_rgba(0,0,0,.18)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="max-w-3xl text-sm leading-6 text-slate-300"><span className="font-semibold text-white">Everything stays in one place.</span> Move forward with one clear step at a time.</p>
        <Button asChild variant="outline" className="shrink-0 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link to="/auth" search={{ mode: "signup" }}>Start building <ArrowRight className="ml-2 size-4" /></Link></Button>
      </div>
    </div>
  );
}
