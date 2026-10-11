import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { Loader2, Wrench } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

/**
 * While the site is under development, only administrators can use it.
 * Everyone else sees a notice with a Google sign-in for the admin.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: isAdmin, isPending } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return data === true;
    },
  });

  // Password recovery must keep working for the admin.
  if (pathname.startsWith("/reset-password")) return <>{children}</>;
  if (user && isAdmin) return <>{children}</>;

  const checking = loading || (!!user && isPending);

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Wrench className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-display text-3xl">We're under development</h1>
        <p className="mt-3 text-muted-foreground">
          Project Helper is currently unavailable to the public while we build something better.
          Please check back soon.
        </p>
        {checking ? (
          <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-muted-foreground" />
        ) : user ? (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-muted-foreground">This account does not have access.</p>
            <Button variant="outline" onClick={() => void supabase.auth.signOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          <Button className="mt-8" variant="outline" onClick={() => void signIn()}>
            Admin sign in with Google
          </Button>
        )}
      </div>
    </main>
  );
}
