import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { signOutAndRedirect } from "@/lib/sign-out";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Account settings — Project Helper" },
      { name: "description", content: "Manage your Project Helper account details." },
      { property: "og:title", content: "Account settings — Project Helper" },
      { property: "og:description", content: "Manage your account details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState((user?.user_metadata?.["full_name"] as string) ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setBusy(false);
    if (error) {
      console.error(error);
      toast.error("We couldn't update your profile.");
      return;
    }
    await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", user!.id);
    toast.success("Profile updated.");
  };

  return (
    <div className="min-h-screen bg-secondary/30 px-5 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
        </Button>

        <PageHeader title="Account settings" description="Your Project Helper account details." />

        <div className="panel space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <Button disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div className="panel space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold">Session</h2>
          <p className="text-sm text-muted-foreground">
            Signing out clears this session on this device.
          </p>
          <Button
            variant="secondary"
            onClick={() => void signOutAndRedirect(() => navigate({ to: "/auth", replace: true }))}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
