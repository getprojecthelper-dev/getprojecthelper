import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeIndianRupee, Globe, Loader2, LockKeyhole, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { premadeAvailabilityKey, usePremadeAvailability } from "@/hooks/use-site-availability";
import { listAdminProjectPricing, updateAdminProjectPricing } from "@/lib/admin.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { updatePremadeAvailability } from "@/lib/site-availability.functions";

type Draft = { regular: string; discount: string };

const rupees = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);

export function AdminProjectPricing() {
  const environment = getPaddleEnvironment();
  const queryClient = useQueryClient();
  const listPricing = useServerFn(listAdminProjectPricing);
  const updatePricing = useServerFn(updateAdminProjectPricing);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const { data: prices = [], isPending } = useQuery({
    queryKey: ["admin-project-pricing", environment],
    queryFn: () => listPricing({ data: { environment } }),
  });

  useEffect(() => {
    setDrafts(Object.fromEntries(prices.map((row) => [row.catalogProjectId, {
      regular: String(row.regularPriceMinor / 100),
      discount: String(row.discountPercent),
    }])));
  }, [prices]);

  const save = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: Draft }) => updatePricing({ data: {
      catalogProjectId: id,
      environment,
      regularPriceMinor: Math.round(Number(draft.regular) * 100),
      discountPercent: Number(draft.discount),
    } }),
    onSuccess: (row) => {
      toast.success(`${row.title} now sells for ${rupees(row.salePriceMinor)}.`);
      void queryClient.invalidateQueries({ queryKey: ["admin-project-pricing", environment] });
      void queryClient.invalidateQueries({ queryKey: ["premade-pricing", environment] });
    },
    onError: (error: Error) => toast.error(error.message || "The project price could not be saved."),
  });

  return (
    <>
      <AdminPremadeAvailability />
      <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BadgeIndianRupee className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg">Project pricing</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Set the regular INR price and discount. Checkout converts the final price for each region.</p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
          {environment === "sandbox" ? "Test prices" : "Live prices"}
        </span>
      </div>

      {isPending ? <p className="mt-5 text-sm text-muted-foreground">Loading project prices…</p> : (
        <div className="mt-5 divide-y divide-border">
          {prices.map((row) => {
            const draft = drafts[row.catalogProjectId] ?? { regular: String(row.regularPriceMinor / 100), discount: String(row.discountPercent) };
            const regularMinor = Math.round(Number(draft.regular || 0) * 100);
            const discount = Number(draft.discount || 0);
            const saleMinor = Math.round(regularMinor * (100 - discount) / 100);
            const valid = Number.isFinite(regularMinor) && regularMinor >= 70 && Number.isInteger(discount) && discount >= 0 && discount <= 90;
            return (
              <div key={row.catalogProjectId} className="grid gap-4 py-5 lg:grid-cols-[minmax(220px,1fr)_150px_130px_170px_auto] lg:items-end">
                <div className="min-w-0">
                  <p className="font-medium">{row.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.priceExternalId}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${row.catalogProjectId}-regular`}>Regular price (₹)</Label>
                  <Input id={`${row.catalogProjectId}-regular`} type="number" min="0.70" step="0.01" value={draft.regular} onChange={(event) => setDrafts((current) => ({ ...current, [row.catalogProjectId]: { ...draft, regular: event.target.value } }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${row.catalogProjectId}-discount`}>Discount (%)</Label>
                  <Input id={`${row.catalogProjectId}-discount`} type="number" min="0" max="90" step="1" value={draft.discount} onChange={(event) => setDrafts((current) => ({ ...current, [row.catalogProjectId]: { ...draft, discount: event.target.value } }))} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Customer pays</p>
                  <p className="mt-1 text-xl font-semibold">{valid ? rupees(saleMinor) : "—"}</p>
                </div>
                <Button disabled={!valid || save.isPending} onClick={() => save.mutate({ id: row.catalogProjectId, draft })}>
                  {save.isPending && save.variables?.id === row.catalogProjectId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </section>
    </>
  );
}

function AdminPremadeAvailability() {
  const status = usePremadeAvailability();
  const queryClient = useQueryClient();
  const save = useServerFn(updatePremadeAvailability);
  const [requested, setRequested] = useState<boolean | null>(null);
  const mutation = useMutation({
    mutationFn: (premadeEnabled: boolean) => save({ data: { premadeEnabled } }),
    onSuccess: (premadeEnabled) => {
      queryClient.setQueryData(premadeAvailabilityKey, premadeEnabled);
      void queryClient.invalidateQueries({ queryKey: premadeAvailabilityKey });
      setRequested(null);
    },
  });

  return (
    <section className="panel mb-6 p-5">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg">Buy projects availability</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {status.isPending
              ? "Checking project store status…"
              : status.isError
                ? "Project store status unavailable."
                : status.data
                  ? "Open · Everyone can browse and buy projects."
                  : "Locked · Students see “Launching soon” and cannot open the store."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2" role="group" aria-label="Buy projects availability">
          <Button
            variant={status.data === true ? "default" : "outline"}
            disabled={status.isPending || status.isError || mutation.isPending || status.data === true}
            onClick={() => { mutation.reset(); setRequested(true); }}
          >
            <Globe className="h-4 w-4" />Open
          </Button>
          <Button
            variant={status.data === false ? "default" : "outline"}
            disabled={status.isPending || status.isError || mutation.isPending || status.data === false}
            onClick={() => { mutation.reset(); setRequested(false); }}
          >
            <LockKeyhole className="h-4 w-4" />Lock
          </Button>
        </div>
      </div>
      {status.isError && <Button variant="outline" className="mt-3" onClick={() => void status.refetch()}>Try again</Button>}
      <Dialog open={requested !== null} onOpenChange={(open) => { if (!open && !mutation.isPending) setRequested(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{requested ? "Open Buy projects for everyone?" : "Lock Buy projects again?"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {requested
              ? "Students will be able to browse the store, open project pages, and pay."
              : "Students will see “Launching soon” and won't be able to open the store or start checkout. Admins can still open it."}
          </p>
          {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={mutation.isPending} onClick={() => setRequested(null)}>Cancel</Button>
            <Button disabled={mutation.isPending} onClick={() => { if (requested !== null) mutation.mutate(requested); }}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {requested ? "Open store" : "Lock store"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}