import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Gift, HelpCircle } from "lucide-react";

import { PlanCards } from "@/components/plan-cards";
import { Button } from "@/components/ui/button";
import { STARTER_CREDITS } from "@/lib/credit-costs";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Plans & Pricing — Free, Student, Max | GetProjectHelper" },
      {
        name: "description",
        content: "Start free, then choose a paid plan with AI credits and active-project limits.",
      },
      { property: "og:title", content: "GetProjectHelper plans: Free, Student, Max" },
      {
        property: "og:description",
        content: "Flexible monthly plans with 100 to 3,000 AI credits.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://getprojecthelper.com/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AI Project Builder Pricing | Project Helper" },
      {
        name: "twitter:description",
        content: "Monthly student plans with AI credits and project limits.",
      },
    ],
    links: [{ rel: "canonical", href: "https://getprojecthelper.com/pricing" }],
  }),
  component: PricingPage,
});

const FAQ = [
  {
    q: "What is a credit?",
    a: "Credits measure your AI usage across build steps, documents and Mentor chats.",
  },
  {
    q: "Do unused credits roll over?",
    a: "No. Each month your credits reset to your plan's amount.",
  },
  {
    q: "What happens when I hit my limit?",
    a: "AI features pause until your next monthly reset, or until you upgrade.",
  },
  {
    q: "Can I change or cancel my plan?",
    a: "Yes. Upgrades and downgrades apply straight away and the price difference is charged or credited. Cancelling keeps your plan until the end of the paid month.",
  },
];

function PricingPage() {
  return (
    <main className="pricing-page min-h-screen">
      <header className="pricing-header border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Button asChild variant="ghost" size="sm" className="pricing-back -ml-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Project Helper
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="pricing-start">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start free
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="pricing-content mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="pricing-intro mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pricing</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">
            A plan for every stage of your project
          </h1>
          <p className="mt-4 text-lg">
            Every new account starts free with 100 credits. Upgrade any time. Credits reset monthly,
            and AI pauses when you reach your plan limit.
          </p>
          <p className="pricing-region-note mt-3 text-sm">
            All plans are priced and billed in USD.
          </p>
        </div>

        <PlanCards className="mt-12" />

        <section className="pricing-bonus mt-10 rounded-2xl border p-6 text-center">
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

        <section className="pricing-faq mx-auto mt-14 max-w-3xl">
          <h2 className="text-center font-display text-2xl">Questions</h2>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {FAQ.map((item) => (
              <div key={item.q} className="pricing-faq-item rounded-xl border p-5">
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
