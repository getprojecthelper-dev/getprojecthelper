import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Loader2, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { usePremadeAvailability } from "@/hooks/use-site-availability";

export const Route = createFileRoute("/_authenticated/premade")({
  component: PremadeSection,
});

function PremadeSection() {
  const availability = usePremadeAvailability();
  const { isAdmin, checking } = useIsAdmin();

  if (availability.isPending || checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 aria-label="Checking project store availability" className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (availability.data === true || isAdmin) return <Outlet />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-display text-3xl">Launching soon</h1>
        <p className="mt-3 text-muted-foreground">
          Buy projects isn't open yet. You can still build a project from your own idea, and the
          store will appear here as soon as it's ready.
        </p>
        <Button asChild className="mt-8" variant="outline">
          <a href="/new-project">Build a project</a>
        </Button>
      </div>
    </main>
  );
}
