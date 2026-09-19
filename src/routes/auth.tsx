import brandMark from "@/assets/mentor-mark.png";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).catch("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Project Helper" },
      { name: "description", content: "Log in or create your Project Helper account." },
      { property: "og:title", content: "Sign in — Project Helper" },
      { property: "og:description", content: "Log in or create your Project Helper account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/welcome", replace: true });
  }, [loading, session, navigate]);

  const submit = async (kind: "login" | "signup") => {
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (kind === "signup") {
        if (fullName.trim().length < 2) {
          toast.error("Enter the name you want shown in Project Helper.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then log in.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (busy) return;
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Enter your email address first, then choose Forgot password.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setNotice("If that address has an account, a reset link is on its way.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't send the reset link.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) throw result.error;
      if (result.redirected) return;

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) throw new Error("Google did not return a valid session.");
      // AuthProvider receives the confirmed session and moves the user to the dashboard.
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "Google sign-in didn't work. Try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center gap-2 font-display text-lg">
          <img src={brandMark} alt="Project Helper" width={512} height={512} className="h-6 w-6" />
          Project Helper
        </Link>

        <h1 className="mb-1 font-display text-2xl tracking-tight text-foreground">
          Sign in to Project Helper
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Log in or create an account to plan, build and document your projects.
        </p>

        <div className="panel p-6">

          <Tabs
            defaultValue={mode}
            onValueChange={(v) =>
              void navigate({ to: "/auth", search: { mode: v as "login" | "signup" } })
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-4">
              {mode === "signup" ? (
                <div className="space-y-2">
                  <Label htmlFor="full-name">Display name</Label>
                  <Input
                    id="full-name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    disabled={busy}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  disabled={busy}
                />
              </div>

              {notice ? (
                <p className="rounded-md bg-info/10 px-3 py-2 text-sm text-info">{notice}</p>
              ) : null}

              <TabsContent value="login" className="m-0 space-y-3">
                <Button className="w-full" disabled={busy} onClick={() => void submit("login")}>
                  {busy ? "Signing in…" : "Log in"}
                </Button>
                <button
                  type="button"
                  onClick={() => void forgotPassword()}
                  disabled={busy}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Forgot password?
                </button>
              </TabsContent>

              <TabsContent value="signup" className="m-0">
                <Button className="w-full" disabled={busy} onClick={() => void submit("signup")}>
                  {busy ? "Creating account…" : "Create account"}
                </Button>
              </TabsContent>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" className="w-full" disabled={busy} onClick={() => void google()}>
                Continue with Google
              </Button>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
