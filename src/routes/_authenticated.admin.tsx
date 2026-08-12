import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CreditCard, Cpu, ShieldCheck, Sparkles, Users } from "lucide-react";

import { MeterBar, MetricCard } from "@/components/metrics";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/state-views";
import { Button } from "@/components/ui/button";
import { getAdminStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — Project Helper" },
      {
        name: "description",
        content: "Registered users, AI credit consumption and subscription revenue for Project Helper.",
      },
      { property: "og:title", content: "Admin dashboard — Project Helper" },
      { property: "og:description", content: "Users, AI credits and subscriptions at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-md p-10">
      <ErrorState message={error.message} />
    </div>
  ),
  notFoundComponent: () => <EmptyState title="Nothing here" description="This page does not exist." />,
});

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function AdminDashboard() {
  const navigate = useNavigate();
  const fetchStats = useServerFn(getAdminStats);
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(),
  });

  if (isPending) return <LoadingState label="Loading admin metrics…" />;
  if (isError) {
    const forbidden = /forbidden/i.test(error?.message ?? "");
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        {forbidden ? (
          <ErrorState message="You need an administrator account to view this dashboard." />
        ) : (
          <ErrorState
            message={error?.message ?? "Could not load admin metrics."}
            onRetry={() => void refetch()}
          />
        )}
        <Button className="mt-4" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
          Back to my projects
        </Button>
      </div>
    );
  }

  const peak = Math.max(1, ...data.ai.daily.map((d) => d.credits));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-8">
      <PageHeader
        title="Admin dashboard"
        description="Platform-wide view of registered students, AI credit consumption and subscriptions."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              My projects
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Registered users"
          value={data.users.total}
          hint={`${data.users.last7d} new in the last 7 days · ${data.users.last30d} in 30 days`}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          label="AI credits used"
          value={data.ai.credits.toLocaleString()}
          hint={`${data.ai.calls.toLocaleString()} AI runs · ${data.ai.tokens.toLocaleString()} tokens`}
          icon={<Sparkles className="h-4 w-4" />}
          tone="warn"
        />
        <MetricCard
          label="Subscriptions"
          value={data.subscriptions.active}
          hint={`${money(data.subscriptions.mrrCents)} recurring · ${data.subscriptions.total} total records`}
          icon={<CreditCard className="h-4 w-4" />}
          tone="good"
        />
        <MetricCard
          label="Projects created"
          value={data.projects.total}
          hint={`${data.projects.active} currently active`}
          icon={<Cpu className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">AI credits — last 14 days</h2>
          <div className="mt-6 flex h-40 items-end gap-1.5">
            {data.ai.daily.map((d) => (
              <div key={d.day} className="group flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t bg-primary/70 transition group-hover:bg-primary"
                  style={{ height: `${Math.max(2, (d.credits / peak) * 100)}%` }}
                  title={`${d.day}: ${d.credits} credits`}
                />
                <span className="text-[10px] text-muted-foreground">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Credits by feature</h2>
          {data.ai.byFeature.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No AI usage recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.ai.byFeature.map((f) => (
                <li key={f.feature}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{f.feature.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">
                      {f.credits} cr · {f.calls} runs
                    </span>
                  </div>
                  <MeterBar value={(f.credits / Math.max(1, data.ai.credits)) * 100} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Newest registrations</h2>
          {data.recentUsers.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="pb-2 font-semibold">Name</th>
                  <th className="pb-2 font-semibold">Email</th>
                  <th className="pb-2 text-right font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((u) => (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="py-2">{u.name ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">{u.email}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Plans</h2>
          {data.subscriptions.byPlan.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No paid subscriptions yet. Once billing is live, active plans appear here.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {data.subscriptions.byPlan.map((p) => (
                <li key={p.plan} className="flex items-center justify-between">
                  <span className="capitalize">{p.plan}</span>
                  <span className="text-muted-foreground">{p.count} subscribers</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Only administrators can open this page.
          </p>
        </section>
      </div>
    </div>
  );
}
