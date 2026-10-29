import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const siteAvailabilityKey = ["site-availability"];

export function useSiteAvailability() {
  return useQuery({
    queryKey: siteAvailabilityKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_availability")
        .select("maintenance_enabled").eq("id", true).single();
      if (error) throw new Error("Website availability could not be loaded.");
      return data.maintenance_enabled;
    },
    staleTime: 0,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}