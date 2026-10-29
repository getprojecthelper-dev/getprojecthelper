import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Loader2, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { siteAvailabilityKey, useSiteAvailability } from "@/hooks/use-site-availability";
import { updateSiteAvailability } from "@/lib/site-availability.functions";

export function AdminSiteAvailability() {
  const status = useSiteAvailability();
  const queryClient = useQueryClient();
  const save = useServerFn(updateSiteAvailability);
  const [requested, setRequested] = useState<boolean | null>(null);
  const mutation = useMutation({
    mutationFn: (maintenanceEnabled: boolean) => save({ data: { maintenanceEnabled } }),
    onSuccess: (maintenanceEnabled) => {
      queryClient.setQueryData(siteAvailabilityKey, maintenanceEnabled);
      void queryClient.invalidateQueries({ queryKey: siteAvailabilityKey });
      setRequested(null);
    },
  });
  return (
    <section className="border-y border-border py-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl">Website availability</h2>
          <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
            {status.isPending ? "Checking website status…" : status.isError ? "Website status unavailable." : status.data ? "Private · Under maintenance. Only admins can access the website." : "Public · The website is open to everyone."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2" role="group" aria-label="Website availability">
          <Button variant={status.data === false ? "default" : "outline"} disabled={status.isPending || status.isError || mutation.isPending || status.data === false} onClick={() => { mutation.reset(); setRequested(false); }}>
            <Globe className="h-4 w-4" />Public
          </Button>
          <Button variant={status.data === true ? "default" : "outline"} disabled={status.isPending || status.isError || mutation.isPending || status.data === true} onClick={() => { mutation.reset(); setRequested(true); }}>
            <LockKeyhole className="h-4 w-4" />Private
          </Button>
        </div>
      </div>
      {status.isError && <Button variant="outline" className="mt-3" onClick={() => void status.refetch()}>Try again</Button>}
      <Dialog open={requested !== null} onOpenChange={(open) => { if (!open && !mutation.isPending) setRequested(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{requested ? "Put website under maintenance?" : "Make website public?"}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{requested ? "Visitors will see the under-development notice. Admin access and sign-in will remain available." : "Everyone will be able to open the website again."}</p>
          {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={mutation.isPending} onClick={() => setRequested(null)}>Cancel</Button>
            <Button disabled={mutation.isPending} onClick={() => { if (requested !== null) mutation.mutate(requested); }}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {requested ? "Enable maintenance" : "Make public"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}