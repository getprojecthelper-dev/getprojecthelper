import brandMark from "@/assets/mentor-mark.png";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Menu, MessageSquareText } from "lucide-react";

import { DomainCards } from "@/components/domain-cards";
import { HeroShowcase } from "@/components/hero-showcase";
import { LifecycleStepper } from "@/components/lifecycle-stepper";
import { Testimonials } from "@/components/testimonials";
import { FeatureGrid } from "@/components/feature-grid";

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
    ["How it works", "#how-it-works"],
    ["Domains", "#domains"],
    ["Features", "#features"],
    ["AI Mentor", "#mentor"],
  ] as const;
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto grid h-20 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 sm:px-6 lg:flex lg:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-lg text-hero-ink">
            <img src={brandMark} alt="Project Helper" width={512} height={512} className="h-6 w-6 shrink-0" />
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
            <Link to="/pricing" className="story-link text-hero-ink-muted transition-colors hover:text-hero-ink">
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
                      <a href={href} className="rounded-md px-3 py-3 font-medium hover:bg-secondary">
                        {label}
                      </a>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link to="/pricing" className="rounded-md px-3 py-3 font-medium hover:bg-secondary">
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
                    <Link to={session ? "/welcome" : "/auth"}>{session ? "Open workspace" : "Log in"}</Link>
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

        <section id="how-it-works" className="border-b border-border bg-secondary/50">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">How it works</span>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">From idea to project in a few simple steps</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Every stage answers three questions: where am I, how am I doing, and what should I do next.
              </p>
            </div>
            <LifecycleStepper />
          </div>
        </section>

        <section id="domains" className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 max-sm:grid-cols-1">
            <div className="min-w-0">
              <h2 className="font-display text-3xl">Popular domains</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Start your project in any of these domains each one opens the right sections.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/auth" search={{ mode: "signup" }}>
                Explore all domains
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <DomainCards />
        </section>

        <section id="features" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase text-primary">One connected workspace</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl sm:text-4xl">
              The work stays connected from first idea to final defence.
            </h2>
            <FeatureGrid />
          </div>
        </section>

        <section
          id="mentor"
          className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"
        >
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <MessageSquareText className="h-5 w-5" />
            </span>
            <h2 className="mt-5 font-display text-3xl sm:text-4xl">A mentor that knows your actual project.</h2>
            <p className="mt-4 text-muted-foreground">
              Import a project and ask about its plan, requirements, code, tests, or viva. Every conversation starts
              fresh and stays grounded in your work.
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
                Your test results show the training score rose while validation fell. That usually means the model
                memorised noise. Try removing the two weakest features, then compare both scores again.
              </div>
            </div>
          </div>
        </section>
        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-display text-3xl">Loved by students &amp; developers</h2>
              <p className="mt-2 text-sm text-muted-foreground">See what people building real projects say.</p>
            </div>
            <Testimonials />
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
