import {
  Link,
  createFileRoute,
  useNavigate,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Coins,
  CreditCard,
  Cpu,
  Gauge,
  Hammer,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";

import { AdminModelUsage } from "@/components/admin-model-usage";
import { AdminReferralCodes } from "@/components/admin-referral-codes";
import { AdminProjectPricing } from "@/components/admin-project-pricing";
import { AdminSiteAvailability } from "@/components/admin-site-availability";
import { MeterBar, MetricCard } from "@/components/metrics";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/state-views";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAdminStats, getAdminUserDetails } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "users", label: "User Info", icon: Users },
  { id: "credits", label: "Credits", icon: Coins },
  { id: "building", label: "Building", icon: Hammer },
  { id: "tokens", label: "Token Tracker", icon: Gauge },
  { id: "premade", label: "Premade Project Listing", icon: Package },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (search: Record<string, unknown>): { tab: SectionId } => ({
    tab: SECTIONS.some((x) => x.id === search["tab"]) ? (search["tab"] as SectionId) : "users",
  }),
  head: () => ({
    meta: [
      { title: "Adport — Project Helper" },
      {
        name: "description",
        content:
          "Registered users, AI credit consumption and subscription revenue for Project Helper.",
      },
      { property: "og:title", content: "Adport — Project Helper" },
      { property: "og:description", content: "Users, AI credits and subscriptions at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
  errorComponent: ({ error }: ErrorComponentProps) => (
    <div className="mx-auto max-w-md p-10">
      <ErrorState message={error instanceof Error ? error.message : "Something went wrong."} />
    </div>
  ),
  notFoundComponent: () => (
    <EmptyState title="Nothing here" description="This page does not exist." />
  ),
});

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function Progress({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{value}%</span>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const fetchStats = useServerFn(getAdminStats);
  const fetchUserDetails = useServerFn(getAdminUserDetails);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(),
  });
  const userDetailsQuery = useQuery({
    queryKey: ["admin-user-details", selectedUserId],
    queryFn: () => fetchUserDetails({ data: { userId: selectedUserId! } }),
    enabled: selectedUserId !== null,
  });

  if (isPending) return <LoadingState label="Loading admin metrics…" />;
  if (isError || data.forbidden) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        {data?.forbidden ? (
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

  const series = data.ai[range] ?? data.ai.daily ?? [];
  const peak = Math.max(1, ...series.map((d) => d.credits));
  const selectedUserSummary = selectedUserId
    ? data.users_list.find((user) => user.id === selectedUserId)
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8">
      <PageHeader
        title="Adport"
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

      <AdminSiteAvailability />

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <nav className="panel flex gap-1 overflow-x-auto p-2 md:sticky md:top-6 md:flex-col">
            {SECTIONS.map((sec) => (
              <Link
                key={sec.id}
                to="/admin"
                search={{ tab: sec.id }}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition",
                  tab === sec.id
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60",
                )}
              >
                <sec.icon className="h-4 w-4" />
                {sec.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1 space-y-6">
          {tab === "users" && (
            <>
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
                  <h2 className="font-display text-lg">Newest registrations</h2>
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
                  <h2 className="font-display text-lg">Plans</h2>
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

              <section className="panel p-5">
                <h2 className="font-display text-lg">Registered users</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                        <th className="pb-2 font-semibold">User</th>
                        <th className="pb-2 font-semibold">Plan</th>
                        <th className="pb-2 text-right font-semibold">AI credits used</th>
                        <th className="pb-2 text-right font-semibold">Projects</th>
                        <th className="pb-2 text-right font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.users_list ?? []).map((u) => (
                        <tr key={u.id} className="border-t border-border/60">
                          <td className="py-2 pr-4">
                            <button
                              type="button"
                              onClick={() => setSelectedUserId(u.id)}
                              className="group text-left"
                              aria-label={`View projects and credit usage for ${u.name ?? u.email}`}
                            >
                              <span className="block font-medium group-hover:text-primary">
                                {u.name ?? "Unnamed user"}
                              </span>
                              <span className="block text-xs text-muted-foreground">{u.email}</span>
                            </button>
                          </td>
                          <td className="py-2 pr-4 capitalize text-muted-foreground">
                            {u.plan ?? "Free"}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {u.credits.toLocaleString()}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">{u.projects}</td>
                          <td className="py-2 text-right text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="panel p-5">
                <h2 className="font-display text-lg">Heaviest consumers</h2>
                {(data.topUsers ?? []).length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No AI usage recorded yet.</p>
                ) : (
                  <table className="mt-4 w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                        <th className="pb-2 font-semibold">User</th>
                        <th className="pb-2 text-right font-semibold">Credits</th>
                        <th className="pb-2 text-right font-semibold">Tokens</th>
                        <th className="pb-2 text-right font-semibold">AI runs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.topUsers ?? []).map((u) => (
                        <tr key={u.id} className="border-t border-border/60">
                          <td className="py-2">{u.name ?? u.email}</td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {u.credits.toLocaleString()}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {u.tokens.toLocaleString()}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">{u.calls}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <AdminReferralCodes />
            </>
          )}
          {tab === "credits" && (
            <>
              <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
                <section className="panel p-5">
                  <h2 className="font-display text-lg">AI credits used</h2>
                  <div className="mt-3 flex gap-1">
                    {(["daily", "weekly", "monthly"] as const).map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={r === range ? "secondary" : "ghost"}
                        className="h-7 px-3 text-xs capitalize"
                        onClick={() => setRange(r)}
                      >
                        {r === "daily" ? "30 days" : r === "weekly" ? "12 weeks" : "12 months"}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-6 flex h-40 items-end gap-1.5">
                    {series.map((d, i) => (
                      <div
                        key={d.day}
                        className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                      >
                        <div
                          className="w-full rounded-t bg-primary/70 transition group-hover:bg-primary"
                          style={{ height: `${Math.max(2, (d.credits / peak) * 100)}%` }}
                          title={`${d.day}: ${d.credits} credits`}
                        />
                        <span className="h-3 text-[10px] text-muted-foreground">
                          {(range !== "daily" || i % 5 === 0) &&
                            (range === "monthly" ? d.day.slice(2) : d.day.slice(5))}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel p-5">
                  <h2 className="font-display text-lg">Credits by feature</h2>
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
            </>
          )}
          {tab === "building" && (
            <>
              <section className="panel p-5">
                <h2 className="font-display text-lg">My projects</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your own projects and how far along they are.
                </p>
                {data.userProjects.filter((p) => p.isMine).length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    You haven't started any projects yet.
                  </p>
                ) : (
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {data.userProjects
                      .filter((p) => p.isMine)
                      .map((p) => (
                        <li key={p.id}>
                          <Link
                            to="/projects/$projectId"
                            params={{ projectId: p.id }}
                            className="block rounded-lg border border-border/60 p-4 transition hover:bg-secondary"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate font-medium">{p.name}</span>
                              <span className="text-xs capitalize text-muted-foreground">
                                {p.domain.replace(/_/g, " ")}
                              </span>
                            </div>
                            <div className="mt-3">
                              <Progress value={p.progress} />
                            </div>
                          </Link>
                        </li>
                      ))}
                  </ul>
                )}
              </section>

              <section className="panel p-5">
                <h2 className="font-display text-lg">What users are building</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The most recently active projects and who is working on them.
                </p>
                {data.userProjects.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No projects have been created yet.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                          <th className="pb-2 font-semibold">Project</th>
                          <th className="pb-2 font-semibold">Builder</th>
                          <th className="pb-2 font-semibold">Domain</th>
                          <th className="pb-2 font-semibold">Stage</th>
                          <th className="pb-2 font-semibold">Progress</th>
                          <th className="pb-2 font-semibold">Status</th>
                          <th className="pb-2 text-right font-semibold">Last active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.userProjects.map((p) => (
                          <tr key={p.id} className="border-t border-border/60">
                            <td className="py-2 pr-4 font-medium">{p.name}</td>
                            <td className="py-2 pr-4">
                              <button
                                type="button"
                                onClick={() => setSelectedUserId(p.ownerId)}
                                className="text-left font-medium text-primary underline-offset-4 hover:underline"
                              >
                                {p.ownerName ?? "—"}
                              </button>
                              <div className="text-xs text-muted-foreground">{p.ownerEmail}</div>
                            </td>
                            <td className="py-2 pr-4 capitalize text-muted-foreground">
                              {p.domain.replace(/_/g, " ")}
                            </td>
                            <td className="py-2 pr-4 capitalize text-muted-foreground">
                              {p.currentStage.replace(/_/g, " ")}
                            </td>
                            <td className="py-2 pr-4">
                              <Progress value={p.progress} />
                            </td>
                            <td className="py-2 pr-4">
                              <span
                                className={
                                  p.status === "completed"
                                    ? "rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary"
                                    : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                                }
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="py-2 text-right text-muted-foreground">
                              {new Date(p.updatedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
          {tab === "tokens" && <AdminModelUsage />}
          {tab === "premade" && <AdminProjectPricing />}
        </div>
      </div>

      <Dialog
        open={selectedUserId !== null}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
      >
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{userDetailsQuery.data?.user.name ?? "User details"}</DialogTitle>
          </DialogHeader>
          {userDetailsQuery.isPending && (
            <p className="py-6 text-sm text-muted-foreground">
              Loading projects and credit history…
            </p>
          )}
          {userDetailsQuery.isError && (
            <ErrorState
              message={userDetailsQuery.error.message ?? "Could not load user details."}
            />
          )}
          {userDetailsQuery.data && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                {userDetailsQuery.data.user.email ?? "Email unavailable"} · Joined{" "}
                {new Date(userDetailsQuery.data.user.createdAt).toLocaleDateString()}
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Total credits used</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {selectedUserSummary?.credits.toLocaleString() ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Projects</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {userDetailsQuery.data.projects.length}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">AI runs</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {userDetailsQuery.data.usageEventCount}
                  </p>
                </div>
              </div>

              <section className="rounded-lg border border-border/60 p-4">
                <h3 className="font-display font-semibold">What they’re building</h3>
                {userDetailsQuery.data.projects.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    This user has no projects yet.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {userDetailsQuery.data.projects.map((project) => (
                      <li key={project.id} className="rounded-md bg-secondary/50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{project.name}</p>
                          <span className="rounded-full bg-background px-2 py-0.5 text-xs capitalize text-muted-foreground">
                            {project.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                          {project.domain.replace(/_/g, " ")} ·{" "}
                          {project.currentStage.replace(/_/g, " ")}
                        </p>
                        {(project.idea || project.description) && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                            {project.idea || project.description}
                          </p>
                        )}
                        {project.techStack.length > 0 && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Stack: {project.techStack.join(", ")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display font-semibold">Credit usage</h3>
                  {userDetailsQuery.data.usageEventCount > userDetailsQuery.data.usage.length && (
                    <span className="text-xs text-muted-foreground">
                      Showing the latest {userDetailsQuery.data.usage.length} of{" "}
                      {userDetailsQuery.data.usageEventCount} runs
                    </span>
                  )}
                </div>
                {userDetailsQuery.data.usage.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">No credit usage recorded.</p>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                          <th className="pb-2 font-semibold">When</th>
                          <th className="pb-2 font-semibold">Feature</th>
                          <th className="pb-2 font-semibold">Project</th>
                          <th className="pb-2 text-right font-semibold">Credits</th>
                          <th className="pb-2 text-right font-semibold">Tokens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDetailsQuery.data.usage.map((event) => (
                          <tr key={event.id} className="border-t border-border/60">
                            <td className="py-2 pr-3 text-muted-foreground">
                              {new Date(event.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2 pr-3 capitalize">
                              {event.feature.replace(/[_-]/g, " ")}
                              {event.model && (
                                <span className="block text-xs text-muted-foreground">
                                  {event.model}
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-3">
                              {event.projectName ?? "General / no project linked"}
                            </td>
                            <td className="py-2 text-right font-mono tabular-nums">
                              {event.credits.toLocaleString()}
                            </td>
                            <td className="py-2 text-right font-mono tabular-nums">
                              {event.totalTokens.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
