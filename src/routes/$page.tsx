import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import brandMark from "@/assets/mentor-mark.png";

import { PublicFeedbackForm } from "@/components/public-feedback-form";
import { PublicPage, publicPages } from "@/components/public-page";

const feedbackPages = {
  contact: { title: "Contact us", description: "Have a question or need help? Send us a message and our team will review it.", kind: "contact" as const },
  "report-an-issue": { title: "Report an issue", description: "Tell us about a bug, security concern or problem using Project Helper.", kind: "issue" as const },
  "grievance-redressal": { title: "Grievance redressal", description: "Submit a grievance for our team to review.", kind: "grievance" as const },
};

export const Route = createFileRoute("/$page")({
  head: ({ params }) => {
    const page = feedbackPages[params.page as keyof typeof feedbackPages] ?? publicPages[params.page];
    const title = `${page?.title ?? "Support"} — Project Helper`;
    const description = page?.description ?? "Get help with Project Helper.";
    return { meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  beforeLoad: ({ params }) => {
    if (!(params.page in publicPages) && !(params.page in feedbackPages)) throw notFound();
    return {};
  },
  component: PublicRoute,
});

function PublicRoute() {
  const { page } = Route.useParams();
  const feedback = feedbackPages[page as keyof typeof feedbackPages];
  if (!feedback) return <PublicPage slug={page} />;
  return <div className="landing-editorial public-feedback-page min-h-screen"><header className="landing-header"><Link to="/" className="landing-header__brand public-page__brand"><img src={brandMark} alt="" />GetProjectHelper</Link></header><main><div className="mx-auto max-w-2xl px-5 py-16"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Support</p><h1 className="mt-3 font-display text-4xl">{feedback.title}</h1><p className="mt-4 text-lg text-muted-foreground">{feedback.description}</p><PublicFeedbackForm kind={feedback.kind} /></div></main></div>;
}
