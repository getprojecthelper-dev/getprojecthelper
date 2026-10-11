import brandMark from "@/assets/mentor-mark.png";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Lightbulb, Menu, MessageSquareText, Route as RouteIcon } from "lucide-react";

import { HeroShowcase } from "@/components/hero-showcase";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { HeaderAccountMenu } from "@/components/header-account-menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Project Builder for Students | Project Helper" },
      {
        name: "description",
        content:
          "Build student projects from idea to portfolio with guided planning, code, datasets, documentation, testing, AI mentoring and viva preparation.",
      },
      { property: "og:title", content: "AI Project Builder for Students | Project Helper" },
      {
        property: "og:description",
        content:
          "Build student projects from idea to portfolio with guided planning, code, datasets, documentation, testing, AI mentoring and viva preparation.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://getprojecthelper.com/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AI Project Builder for Students | Project Helper" },
      {
        name: "twitter:description",
        content:
          "Build student projects from idea to portfolio with guided planning, code, documentation, testing and AI mentoring.",
      },
    ],
    links: [{ rel: "canonical", href: "https://getprojecthelper.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Project Helper",
          url: "https://getprojecthelper.com/",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          description:
            "An AI-guided project builder for students, covering planning, implementation, testing, documentation, viva preparation and portfolio creation.",
          audience: { "@type": "EducationalAudience", educationalRole: "student" },
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            description: "New accounts include starter credits.",
          },
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, loading } = useAuth();
  const nav = [
    ["Your journey", "#how-it-works"],
    ["AI Mentor", "#mentor"],
  ] as const;
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto grid h-20 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 sm:px-6 lg:flex lg:justify-between">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5 font-display text-lg font-semibold tracking-[-0.03em] text-hero-ink"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-hero-line bg-hero-ink/10">
              <img src={brandMark} alt="" width={512} height={512} className="h-5 w-5" />
            </span>
            <span className="truncate">Project Helper</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm lg:flex xl:gap-8">
            {nav.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="story-link text-hero-ink-muted transition-colors hover:text-hero-ink"
              >
                {label}
              </a>
            ))}
            <Link
              to="/pricing"
              className="story-link text-hero-ink-muted transition-colors hover:text-hero-ink"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle className="text-hero-ink hover:bg-hero-ink/10" />
            {!loading && session ? (
              <HeaderAccountMenu />
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden text-hero-ink hover:bg-hero-ink/10 hover:text-hero-ink sm:inline-flex"
                >
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Sign up
                  </Link>
                </Button>
              </>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-hero-ink hover:bg-hero-ink/10 hover:text-hero-ink lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(22rem,88vw)]">
                <SheetTitle>Project Helper</SheetTitle>
                <nav className="mt-8 flex flex-col gap-1">
                  {nav.map(([label, href]) => (
                    <SheetClose key={href} asChild>
                      <a
                        href={href}
                        className="rounded-md px-3 py-3 font-medium hover:bg-secondary"
                      >
                        {label}
                      </a>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      to="/pricing"
                      className="rounded-md px-3 py-3 font-medium hover:bg-secondary"
                    >
                      Pricing
                    </Link>
                  </SheetClose>
                </nav>
                <div className="mt-8 grid gap-2">
                  {session ? (
                    <div className="mb-2 rounded-md border border-border bg-secondary/50 p-3">
                      <p className="truncate text-sm font-semibold">
                        {String(session.user.user_metadata?.["full_name"] || "Your profile")}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  ) : null}
                  <Button asChild>
                    <Link to={session ? "/welcome" : "/auth"}>
                      {session ? "Open workspace" : "Log in"}
                    </Link>
                  </Button>
                  {!session ? (
                    <Button asChild variant="outline">
                      <Link to="/auth" search={{ mode: "signup" }}>
                        Create account
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        <HeroShowcase />

        <section id="how-it-works" className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">A calmer way to work</span>
              <h2 className="mt-4 font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">Everything you need. Nothing to get lost in.</h2>
              <p className="mt-4 leading-7 text-muted-foreground">Project Helper keeps your work moving with a simple rhythm you can follow from day one.</p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                { icon: Lightbulb, number: "01", title: "Start with the idea", body: "Describe what you want to make. We help you find a useful, realistic direction." },
                { icon: RouteIcon, number: "02", title: "Follow the plan", body: "Break the work into manageable next steps, with your progress always visible." },
                { icon: Check, number: "03", title: "Show your work", body: "Bring your research, results and reasoning together for a confident final submission." },
              ].map(({ icon: Icon, number, title, body }, index) => (
                <article key={number} className="landing-reveal panel group relative overflow-hidden p-6" style={{ animationDelay: `${index * 110}ms` }}>
                  <span className="text-xs font-bold tracking-[0.14em] text-primary">{number}</span>
                  <span className="mt-8 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110"><Icon className="size-5" /></span>
                  <h3 className="mt-5 font-display text-xl tracking-[-0.03em]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="mentor"
          className="mx-auto grid max-w-5xl gap-10 px-5 py-20 sm:px-6 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"
        >
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <MessageSquareText className="h-5 w-5" />
            </span>
            <span className="mt-5 block text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
              Ask better questions
            </span>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-[-0.035em] sm:text-4xl">
              A mentor that knows your actual project.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Import a project and ask about its plan, requirements, code, tests, or viva. Every
              conversation starts fresh and stays grounded in your work.
            </p>
          </div>
          <div className="panel overflow-hidden">
            <div className="border-b border-border px-5 py-3 text-xs font-semibold uppercase text-muted-foreground">
              Mentor · Flight delay predictor
            </div>
            <div className="space-y-5 p-5 sm:p-7">
              <div className="ml-auto max-w-[82%] rounded-md bg-primary px-4 py-3 text-sm text-primary-foreground">
                Why did my validation score drop after I added more features?
              </div>
              <div className="max-w-[88%] border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">
                Your test results show the training score rose while validation fell. That usually
                means the model memorised noise. Try removing the two weakest features, then compare
                both scores again.
              </div>
            </div>
          </div>
        </section>
        <section className="hero-surface relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-32 size-[28rem] rounded-full bg-primary/20 blur-3xl" />
          <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                Ready when you are
              </span>
              <h2 className="mt-4 font-display text-3xl leading-tight tracking-[-0.04em] text-hero-ink sm:text-4xl">
                Make room for the work that matters.
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-hero-ink-muted">
                Start with your idea today. Project Helper will help you turn it into work you can
                clearly show, defend, and be proud of.
              </p>
            </div>
            <Button asChild size="lg" className="group shrink-0">
              {session ? (
                <Link to="/welcome">
                  Open your workspace
                  <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start your project
                  <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-muted-foreground sm:px-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>© 2026 Sizcon Studios</span>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link to="/refund-policy" className="hover:text-foreground">
              Refund policy
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>
          <Button asChild>
            {session ? (
              <Link to="/welcome">
                Open workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link to="/auth" search={{ mode: "signup" }}>
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
