import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Gift, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createReferralCode, listReferralCodes, setReferralCodeActive } from "@/lib/admin.functions";

export function AdminReferralCodes() {
  const qc = useQueryClient();
  const fetchCodes = useServerFn(listReferralCodes);
  const create = useServerFn(createReferralCode);
  const toggle = useServerFn(setReferralCodeActive);

  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("50");
  const [label, setLabel] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: codes = [], isPending } = useQuery({
    queryKey: ["admin-referral-codes"],
    queryFn: () => fetchCodes(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          code: code.trim() || undefined,
          credits: Number(credits),
          label: label.trim() || undefined,
          maxRedemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
          expiresAt: expiresAt.trim() ? expiresAt : null,
        },
      }),
    onSuccess: (row) => {
      toast.success(`Code ${row.code} created — worth ${row.credits} credits`);
      setCode("");
      setLabel("");
      setMaxRedemptions("");
      setExpiresAt("");
      void qc.invalidateQueries({ queryKey: ["admin-referral-codes"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not create the code."),
  });

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) => toggle({ data: vars }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-referral-codes"] }),
    onError: (e: Error) => toast.error(e.message || "Could not update the code."),
  });

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      toast.error("Copy failed — select the code manually.");
    }
  };

  const creditsValid = Number(credits) > 0;

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg">Redeem codes</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Generate a code with a credit amount. Students enter it on their Credits page to top up instantly.
      </p>

      <form
        className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!creditsValid) return;
          createMutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="rc-code">Code (optional)</Label>
          <Input
            id="rc-code"
            placeholder="Auto-generate"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rc-credits">Credits</Label>
          <Input
            id="rc-credits"
            type="number"
            min={1}
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rc-label">Label</Label>
          <Input
            id="rc-label"
            placeholder="Campus launch"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rc-max">Max uses</Label>
          <Input
            id="rc-max"
            type="number"
            min={1}
            placeholder="Unlimited"
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rc-exp">Expires</Label>
          <Input id="rc-exp" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-5">
          <Button type="submit" disabled={createMutation.isPending || !creditsValid}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Generate code
          </Button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading codes…</p>
        ) : codes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No codes yet — generate your first one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="pb-2 font-semibold">Code</th>
                <th className="pb-2 font-semibold">Credits</th>
                <th className="pb-2 font-semibold">Used</th>
                <th className="pb-2 font-semibold">Expires</th>
                <th className="pb-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => void copy(c.code)}
                      className="inline-flex items-center gap-2 rounded-md bg-muted px-2 py-1 font-mono text-xs transition hover:bg-muted/70"
                      title="Copy code"
                    >
                      {c.code}
                      {copied === c.code ? (
                        <Check className="h-3 w-3 text-primary" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                    {c.label ? (
                      <span className="ml-2 text-xs text-muted-foreground">{c.label}</span>
                    ) : null}
                  </td>
                  <td className="py-2">{c.credits}</td>
                  <td className="py-2 text-muted-foreground">
                    {c.redemption_count}
                    {c.max_redemptions ? ` / ${c.max_redemptions}` : ""}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      size="sm"
                      variant={c.is_active ? "outline" : "secondary"}
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate({ id: c.id, isActive: !c.is_active })}
                    >
                      {c.is_active ? "Active — disable" : "Disabled — enable"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
