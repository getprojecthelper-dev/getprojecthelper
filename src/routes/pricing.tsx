import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Gift, HelpCircle } from "lucide-react";

import { PricingPacks } from "@/components/pricing-packs";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { STARTER_CREDITS } from "@/lib/credit-costs";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — AI credits for student projects | Project Helper" },
      {
        name: "description",
        content:
          "Simple pay-as-you-go credit packs for Project Helper. Start with 50 free credits, then top up from $5 or ₹149. No subscription.",
      },
      { property: "og:title", content: "Pricing — AI credits for student projects" },
      {
        property: "og:description",
        content: "Credit packs from $5 / ₹149. 50 free credits on every new account, no subscription.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const FAQ = [
  {
    q: "What is a credit?",
    a: "One credit is roughly one thousand words of AI thinking. A typical build step — writing code, explaining it, or fixing an error — costs about 5 to 10 credits.",
  },
  {
    q: "Do credits expire?",
    a: "No. Credits stay on your account until you use them, and anything reserved for a run that fails comes straight back to your balance.",
  },
  {
    q: "Why are Indian prices lower?",
    a: "Project Helper is built for students. Prices are set for local student budgets, so the same packs cost less in India and South Asia.",
  },
  {
    q: "Is there a subscription?",
    a: "No. You buy credits when you need them, and nothing renews automatically.",
  },
];

function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Project Helper
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start free
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pricing</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">
            Pay only for the AI you actually use
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            No subscription, no seats, nothing to cancel. Every new account starts with{" "}
            {STARTER_CREDITS} free credits — enough to shape your idea, pick a dataset and plan your
            build.
          </p>
        </div>

        <PricingPacks className="mt-12" />

        <section className="mt-12 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-lg">
            <Gift className="h-4 w-4 text-primary" />
            {STARTER_CREDITS} free credits on signup
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Have a campus or referral code? Redeem it on your credits page for an instant top-up —
            no payment details needed.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create a free account
            </Link>
          </Button>
        </section>

        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-center font-display text-2xl">Questions</h2>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-xl border border-border bg-card p-5">
                <dt className="flex items-start gap-2 font-medium">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item.q}
                </dt>
                <dd className="mt-2 text-sm text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
