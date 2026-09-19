import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
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
  const queryClient = useQueryClient();
  const [name, setName] = useState((user?.user_metadata?.["full_name"] as string) ?? "");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [conciseGuidance, setConciseGuidance] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("profiles")
      .select("full_name,avatar_url,preferences")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setName(data.full_name ?? "");
        setAvatarUrl(data.avatar_url ?? "");
        const preferences = data.preferences as { concise_guidance?: boolean } | null;
        setConciseGuidance(preferences?.concise_guidance ?? true);
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const cleanName = name.trim();
    const cleanAvatar = avatarUrl.trim();
    const [{ error }, { error: profileError }] = await Promise.all([
      supabase.auth.updateUser({ data: { full_name: cleanName, avatar_url: cleanAvatar } }),
      supabase.from("profiles").update({
        full_name: cleanName,
        avatar_url: cleanAvatar || null,
        preferences: { concise_guidance: conciseGuidance },
      }).eq("id", user.id),
    ]);
    setBusy(false);
    if (error || profileError) {
      console.error(error ?? profileError);
      toast.error("We couldn't update your profile.");
      return;
    }
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
            <Label htmlFor="avatar">Avatar image URL</Label>
            <Input
              id="avatar"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
          </div>
          <label className="flex items-start gap-3 rounded-md border border-border p-3">
            <input
              type="checkbox"
              checked={conciseGuidance}
              onChange={(e) => setConciseGuidance(e.target.checked)}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium">Keep guidance concise</span>
              <span className="block text-xs text-muted-foreground">Prefer short explanations with one example and one analogy.</span>
            </span>
          </label>
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
          <h2 className="font-display text-lg">Session</h2>
          <p className="text-sm text-muted-foreground">
            Signing out clears this session on this device.
          </p>
          <Button
            variant="secondary"
            onClick={() => void signOutAndRedirect(queryClient, () => navigate({ to: "/auth", replace: true }))}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
