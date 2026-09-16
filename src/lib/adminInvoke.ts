import { supabase } from "@/integrations/supabase/client";

/**
 * Invoke an admin edge function with a guaranteed-fresh session token.
 * Long-running admin pages can hold an expired access token, which makes the
 * function reply "Unauthorized" even though the admin is still signed in.
 */
export async function invokeAdminFunction<T = any>(
  name: string,
  body: Record<string, unknown>
): Promise<T> {
  let { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session;

  const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
  if (!session || expiresAt - Date.now() < 60_000) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session ?? session;
  }

  if (!session) {
    throw new Error("Your session expired — please sign in again.");
  }

  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    throw new Error(
      error.message?.includes("401")
        ? "Your session expired — please sign in again."
        : error.message || "Request failed"
    );
  }

  return data as T;
}
