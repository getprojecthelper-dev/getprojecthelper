import { supabase } from "@/integrations/supabase/client";

/**
 * Clears the session and hands control back to the caller for navigation.
 * Query cache teardown happens through the auth state change + route remount.
 */
export async function signOutAndRedirect(redirect: () => void | Promise<unknown>) {
  await supabase.auth.signOut();
  await redirect();
}
