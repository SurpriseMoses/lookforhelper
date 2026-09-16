import { supabase } from "@/integrations/supabase/client";

/**
 * Drop-in replacement for supabase.functions.invoke that guarantees a fresh
 * access token. Long-running admin pages can hold an expired token, which makes
 * edge functions reply "Unauthorized" even though the admin is still signed in.
 */
export async function invokeWithFreshAuth(
  name: string,
  options: { body?: unknown } = {}
): Promise<{ data: any; error: Error | null }> {
  let { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session;

  const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
  if (!session || expiresAt - Date.now() < 60_000) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session ?? session;
  }

  if (!session) {
    return {
      data: null,
      error: new Error("Your session expired — please sign in again."),
    };
  }

  const { data, error } = await supabase.functions.invoke(name, {
    ...options,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  return { data, error: error ? new Error(error.message) : null };
}
