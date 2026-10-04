import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { CreditMeter } from "@/components/credit-meter";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Workspace — Project Helper" },
      { name: "description", content: "Your private Project Helper workspace." },
      { property: "og:title", content: "Workspace — Project Helper" },
      { property: "og:description", content: "Your private Project Helper workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLocalPreview =
    typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

  useEffect(() => {
    if (!isLocalPreview && !loading && !session) void navigate({ to: "/auth", replace: true });
  }, [isLocalPreview, loading, session, navigate]);

  if (!isLocalPreview && (loading || !session)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // The admin console keeps its own standalone chrome.
  if (pathname.startsWith("/admin")) {
    return (
      <>
        <Outlet />
        <CreditMeter />
      </>
    );
  }

  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <CreditMeter />
    </>
  );
}
