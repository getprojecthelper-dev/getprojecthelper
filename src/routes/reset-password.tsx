import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Project Helper" },
      { name: "description", content: "Choose a new password for your Project Helper account." },
      { property: "og:title", content: "Reset password — Project Helper" },
      { property: "og:description", content: "Choose a new password for your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validRecovery, setValidRecovery] = useState(false);

  useEffect(() => {
    let active = true;
    const checkRecovery = async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const query = new URLSearchParams(window.location.search);
      const recoveryHint = hash.get("type") === "recovery" || query.get("type") === "recovery";
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setValidRecovery(Boolean(data.session) && recoveryHint);
      setChecking(false);
    };
    void checkRecovery();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event !== "PASSWORD_RECOVERY") return;
      setValidRecovery(Boolean(session));
      setChecking(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const submit = async () => {
    const parsed = z.string().min(8, "Use at least 8 characters").max(72).safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    void navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-5">
      <div className="panel w-full max-w-md space-y-4 p-6">
        <h1 className="font-display text-xl">
          {checking ? "Checking your link…" : validRecovery ? "Set a new password" : "Reset link unavailable"}
        </h1>
        {!checking && !validRecovery ? (
          <>
            <p className="text-sm text-muted-foreground">
              This link is invalid or has expired. Request a fresh link from the login page.
            </p>
            <Button onClick={() => void navigate({ to: "/auth", replace: true })} className="w-full">
              Back to login
            </Button>
          </>
        ) : null}
        {validRecovery ? <>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button className="w-full" disabled={busy} onClick={() => void submit()}>
          {busy ? "Saving…" : "Update password"}
        </Button>
        </> : null}
      </div>
    </div>
  );
}
