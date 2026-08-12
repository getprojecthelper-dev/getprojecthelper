import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
        <h1 className="font-display text-xl font-semibold">Set a new password</h1>
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
      </div>
    </div>
  );
}
