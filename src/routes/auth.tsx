import brandMark from "@/assets/mentor-mark.png";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/welcome", replace: true });
  }, [loading, session, navigate]);

  // Count the sign-up cooldown down once per second so the button re-enables itself.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const submit = async (kind: "login" | "signup") => {
    if (kind === "signup" && cooldown > 0) return;
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
      const raw = error instanceof Error ? error.message : "Authentication failed";
      const status = (error as { status?: number } | null)?.status;
      const seconds = Number(/after (\d+) seconds/.exec(raw)?.[1] ?? 0);

      if (kind === "signup" && (status === 429 || /only request this after|rate limit/i.test(raw))) {
        // The confirmation email was already sent moments ago; stop the retry loop.
        setCooldown(seconds > 0 ? seconds : 60);
        setNotice(
          "We already sent your confirmation email — please check your inbox (and spam folder). You can try again in a moment if it doesn't arrive.",
        );
      } else if (/weak|pwned|known to be/i.test(raw)) {
        setNotice(
          "That password is too easy to guess. Use at least 8 characters and mix in numbers or symbols — avoid common words.",
        );
      } else {
        toast.error(raw);
      }
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
    <main className="auth-stage relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-4 py-4 sm:px-8 sm:py-6">
      <svg className="auth-diagram pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
        <path className="auth-diagram-line" d="M-80 580 C170 590 178 160 435 215 S675 60 780 -30 M1440 170 C1220 150 1330 395 1090 450 S1050 770 1430 855 M-90 790 C220 680 250 930 550 855 M990 5 C970 235 1260 220 1490 350" />
        <path className="auth-diagram-dash" d="M-80 580 C170 590 178 160 435 215 S675 60 780 -30 M1440 170 C1220 150 1330 395 1090 450 S1050 770 1430 855" />
        <circle cx="435" cy="215" r="7" className="auth-diagram-node" />
        <circle cx="1090" cy="450" r="7" className="auth-diagram-node" />
        <circle cx="265" cy="736" r="5" className="auth-diagram-node" />
        <circle cx="1250" cy="226" r="5" className="auth-diagram-node" />
      </svg>

      <div className="relative z-10 w-full max-w-[460px] auth-entrance">
        <Link to="/" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-auth-mist transition-colors hover:text-auth-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auth-coral">
          <ArrowLeft className="size-4" /> Back to home
        </Link>

        <section className="auth-sheet overflow-hidden rounded-md bg-auth-light text-auth-pine shadow-auth-sheet" aria-labelledby="auth-heading">
          <div className="h-1.5 bg-auth-coral" />
          <div className="px-5 py-5 sm:px-8 sm:py-6">
            <div className="mb-5 text-center">
              <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-md bg-auth-pine">
                <img src={brandMark} alt="" width={512} height={512} className="size-7 object-contain" />
              </span>
              <h1 id="auth-heading" className="font-display text-[26px] font-bold text-auth-pine sm:text-[28px]">Project Helper</h1>
              <p className="mt-1.5 text-sm text-auth-sage">{mode === "signup" ? "Start something worth sharing." : "Welcome back to your workspace."}</p>
            </div>

            <div className="mb-4 grid grid-cols-2 border-b border-auth-line" aria-label="Account mode">
              {(["login", "signup"] as const).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant="ghost"
                  aria-current={mode === option ? "page" : undefined}
                  onClick={() => { setNotice(null); void navigate({ to: "/auth", search: { mode: option } }); }}
                  className={`relative h-10 rounded-none bg-transparent font-semibold shadow-none hover:bg-auth-pine/5 ${mode === option ? "text-auth-pine after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-auth-coral" : "text-auth-sage"}`}
                >
                  {option === "login" ? "Log in" : "Sign up"}
                </Button>
              ))}
            </div>

            <form key={mode} className="auth-form space-y-3" onSubmit={(event) => { event.preventDefault(); void submit(mode); }}>
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="full-name" className="text-xs font-bold text-auth-pine">Display name</Label>
                  <Input id="full-name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" disabled={busy} className="auth-input h-10 rounded-md border-auth-line bg-auth-field px-4 text-auth-pine placeholder:text-auth-sage/70 focus-visible:ring-auth-coral" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-auth-pine">Email address</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" disabled={busy} className="auth-input h-10 rounded-md border-auth-line bg-auth-field px-4 text-auth-pine placeholder:text-auth-sage/70 focus-visible:ring-auth-coral" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password" className="text-xs font-bold text-auth-pine">Password</Label>
                  {mode === "login" && <Button type="button" variant="link" size="sm" onClick={() => void forgotPassword()} disabled={busy} className="h-auto p-0 text-xs font-semibold text-auth-pine hover:text-auth-coral">Forgot password?</Button>}
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} disabled={busy} className="auth-input h-10 rounded-md border-auth-line bg-auth-field px-4 pr-12 text-auth-pine placeholder:text-auth-sage/70 focus-visible:ring-auth-coral" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-1 top-1 size-9 text-auth-sage hover:bg-auth-pine/5 hover:text-auth-pine">
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>

              {notice && <p role="status" className="rounded-md bg-auth-pine/5 px-3 py-2 text-sm text-auth-pine">{notice}</p>}

              <Button type="submit" disabled={busy || (mode === "signup" && cooldown > 0)} className="group mt-1 h-11 w-full rounded-md bg-auth-coral font-display font-bold text-auth-pine shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:bg-auth-coral/90 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-auth-pine">
                {busy ? (mode === "signup" ? "Creating account…" : "Signing in…") : mode === "signup" && cooldown > 0 ? `Try again in ${cooldown}s` : mode === "signup" ? "Create account" : "Log in"}
                {!busy && <ArrowRight className="transition-transform group-hover:translate-x-1" />}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs text-auth-sage"><span className="h-px flex-1 bg-auth-line" />or<span className="h-px flex-1 bg-auth-line" /></div>
            <Button variant="outline" className="h-10 w-full rounded-md border-auth-line bg-transparent font-semibold text-auth-pine shadow-none transition-colors hover:border-auth-pine hover:bg-auth-pine/5 hover:text-auth-pine" disabled={busy} onClick={() => void google()}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current"><path d="M21.35 12.21c0-.68-.06-1.36-.18-2.02H12v3.82h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.7 2.91-4.2 2.91-7.18Z"/><path d="M12 21.5c2.62 0 4.82-.87 6.44-2.35l-3.14-2.44c-.87.58-1.98.94-3.3.94a5.88 5.88 0 0 1-5.53-4.08H3.23v2.51A9.73 9.73 0 0 0 12 21.5Z"/><path d="M6.47 13.57a5.93 5.93 0 0 1 0-3.14V7.92H3.23a9.73 9.73 0 0 0 0 8.16l3.24-2.51Z"/><path d="M12 6.35c1.43 0 2.71.49 3.72 1.47l2.79-2.79A9.35 9.35 0 0 0 12 2.5a9.73 9.73 0 0 0-8.77 5.42l3.24 2.51A5.88 5.88 0 0 1 12 6.35Z"/></svg>
              Continue with Google
            </Button>
            <p className="mt-4 border-t border-auth-line pt-4 text-center text-sm text-auth-sage">
              {mode === "signup" ? "Already have an account?" : "New to Project Helper?"}{" "}
              <Link to="/auth" search={{ mode: mode === "signup" ? "login" : "signup" }} className="font-bold text-auth-pine underline decoration-auth-coral underline-offset-4 transition-colors hover:text-auth-coral">{mode === "signup" ? "Log in" : "Create an account"}</Link>
            </p>
          </div>
        </section>
        <p className="mt-3 text-center text-xs text-auth-mist">Your next project starts here.</p>
      </div>
    </main>
  );
}
