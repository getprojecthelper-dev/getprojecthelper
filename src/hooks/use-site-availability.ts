import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const siteAvailabilityKey = ["site-availability"];
export const premadeAvailabilityKey = ["premade-availability"];

export function useSiteAvailability() {
  return useQuery({
    queryKey: siteAvailabilityKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_availability")
        .select("maintenance_enabled")
        .eq("id", true)
        .single();
      if (error) throw new Error("Website availability could not be loaded.");
      return data.maintenance_enabled;
    },
    // The public maintenance flag changes rarely; a short cache avoids making
    // the site wait on Supabase for every fresh visit and route transition.
    staleTime: 30_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function usePremadeAvailability() {
  return useQuery({
    queryKey: premadeAvailabilityKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_availability")
        .select("premade_enabled")
        .eq("id", true)
        .single();
      if (error) throw new Error("Project store availability could not be loaded.");
      return data.premade_enabled;
    },
    staleTime: 0,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}
