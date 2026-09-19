import { supabase } from "@/integrations/supabase/client";
import type { QueryClient } from "@tanstack/react-query";

/**
 * Clears the session and hands control back to the caller for navigation.
 * Query cache teardown happens through the auth state change + route remount.
 */
export async function signOutAndRedirect(
  queryClient: QueryClient,
  redirect: () => void | Promise<unknown>,
) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
  await redirect();
}
