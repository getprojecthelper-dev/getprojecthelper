import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, Globe, ImagePlus, Loader2, LockKeyhole, Pencil, Plus, Rocket, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { premadeAvailabilityKey, usePremadeAvailability } from "@/hooks/use-site-availability";
import { getPaddleEnvironment } from "@/lib/paddle";
import {
  deleteListing,
  listAdminListings,
  saveListing,
  setListingFlags,
  type PremadeListing,
} from "@/lib/premade-listings.functions";
import { updatePremadeAvailability } from "@/lib/site-availability.functions";

const rupees = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);

type Draft = {
  id?: string;
  title: string;
  description: string;
  techStack: string;
  imageUrl: string | null;
  domain: PremadeListing["domain"];
  price: string;
};

const EMPTY: Draft = { title: "", description: "", techStack: "", imageUrl: null, domain: "software", price: "" };

/** Shrinks an uploaded image to a small JPEG data URL so it can be saved with the listing. */
async function resizeImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const scale = Math.min(1, 960 / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AdminProjectPricing() {
  const environment = getPaddleEnvironment();
  const queryClient = useQueryClient();
  const list = useServerFn(listAdminListings);
  const save = useServerFn(saveListing);
  const flags = useServerFn(setListingFlags);
  const remove = useServerFn(deleteListing);
  const [draft, setDraft] = useState<Draft | null>(null);
  const key = ["admin-premade-listings", environment];

  const { data: listings = [], isPending } = useQuery({ queryKey: key, queryFn: () => list({ data: { environment } }) });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ["premade-listings"] });
  };

  const saveMutation = useMutation({
    mutationFn: (d: Draft) => save({ data: {
      ...(d.id ? { id: d.id } : {}),
      environment,
      title: d.title,
      description: d.description,
      techStack: d.techStack,
      imageUrl: d.imageUrl,
      domain: d.domain,
      priceMinor: Math.round(Number(d.price) * 100),
    } }),
    onSuccess: (row) => { toast.success(`${row.title} saved.`); setDraft(null); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const flagMutation = useMutation({
    mutationFn: (v: { id: string; isLive?: boolean; isAvailable?: boolean }) => flags({ data: v }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Listing deleted."); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const priceMinor = draft ? Math.round(Number(draft.price || 0) * 100) : 0;
  const valid = draft && draft.title.trim().length >= 2 && draft.description.trim().length >= 10
    && draft.techStack.trim() && priceMinor >= 70;

  return (
    <>
      <AdminPremadeAvailability />
      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg">Project listings</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add a project, then make it live when it's ready for students.</p>
          </div>
          <Button onClick={() => setDraft({ ...EMPTY })}><Plus className="h-4 w-4" />List Project</Button>
        </div>

        {isPending ? <p className="mt-5 text-sm text-muted-foreground">Loading listings…</p> : listings.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">No projects listed yet.</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <article key={l.id} className="overflow-hidden rounded-lg border border-border">
                {l.imageUrl ? <img src={l.imageUrl} alt={l.title} className="aspect-[16/10] w-full object-cover" /> : <div className="aspect-[16/10] w-full bg-secondary" />}
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase">
                    <span className={`rounded-full px-2 py-0.5 ${l.isLive ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"}`}>{l.isLive ? "Live" : "Draft"}</span>
                    <span className={`rounded-full px-2 py-0.5 ${l.isAvailable ? "bg-secondary text-muted-foreground" : "bg-destructive/15 text-destructive"}`}>{l.isAvailable ? "Available" : "Not available"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base">{l.title}</h3>
                    <span className="shrink-0 font-semibold">{rupees(l.priceMinor)}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{l.description}</p>
                  <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Tech:</span> {l.techStack}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant={l.isLive ? "outline" : "default"} disabled={flagMutation.isPending} onClick={() => flagMutation.mutate({ id: l.id, isLive: !l.isLive })}>
                      <Rocket className="h-3.5 w-3.5" />{l.isLive ? "Unpublish" : "Make live"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={flagMutation.isPending} onClick={() => flagMutation.mutate({ id: l.id, isAvailable: !l.isAvailable })}>
                      {l.isAvailable ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{l.isAvailable ? "Mark not available" : "Mark available"}
                    </Button>
                    <Button size="sm" variant="ghost" aria-label="Edit" onClick={() => setDraft({ id: l.id, title: l.title, description: l.description, techStack: l.techStack, imageUrl: l.imageUrl, domain: l.domain, price: String(l.priceMinor / 100) })}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" aria-label="Delete" disabled={deleteMutation.isPending} onClick={() => { if (confirm(`Delete ${l.title}?`)) deleteMutation.mutate(l.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog open={draft !== null} onOpenChange={(open) => { if (!open && !saveMutation.isPending) setDraft(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{draft?.id ? "Edit project" : "List a project"}</DialogTitle></DialogHeader>
          {draft && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valid) saveMutation.mutate(draft); }}>
              <div className="space-y-1.5"><Label htmlFor="pl-title">Title</Label>
                <Input id="pl-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="pl-desc">Description</Label>
                <Textarea id="pl-desc" rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="pl-stack">Tech stack</Label>
                <Input id="pl-stack" placeholder="React, Node.js, PostgreSQL" value={draft.techStack} onChange={(e) => setDraft({ ...draft, techStack: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="pl-domain">Type</Label>
                <select id="pl-domain" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.domain} onChange={(e) => setDraft({ ...draft, domain: e.target.value as Draft["domain"] })}>
                  <option value="software">Software Development</option>
                  <option value="data_science">Data Science</option>
                  <option value="project_management">Project Management</option>
                </select></div>
              <div className="space-y-1.5"><Label htmlFor="pl-image">Image</Label>
                {draft.imageUrl && <img src={draft.imageUrl} alt="" className="aspect-[16/10] w-full rounded-md object-cover" />}
                <label htmlFor="pl-image" className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"><ImagePlus className="h-4 w-4" />{draft.imageUrl ? "Change image" : "Upload image"}</label>
                <input id="pl-image" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setDraft({ ...draft, imageUrl: await resizeImage(file) });
                }} /></div>
              <div className="space-y-1.5"><Label htmlFor="pl-price">Price (₹)</Label>
                <Input id="pl-price" type="number" min="1" step="1" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" disabled={saveMutation.isPending} onClick={() => setDraft(null)}>Cancel</Button>
                <Button type="submit" disabled={!valid || saveMutation.isPending}>{saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
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