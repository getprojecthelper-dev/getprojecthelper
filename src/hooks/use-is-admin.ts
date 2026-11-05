import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

/** True only when the signed-in account has the admin role. */
export function useIsAdmin() {
  const { user, loading } = useAuth();
  const query = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return data === true;
    },
  });
  return { isAdmin: query.data === true, checking: loading || (!!user && query.isPending) };
}
