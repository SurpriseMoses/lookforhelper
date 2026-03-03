import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to get their ID
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Use service role client to delete all user data and auth record
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete from all tables that reference user_id (order matters for FK constraints)
    const tablesToClean = [
      { table: "messages", column: "sender_id" },
      { table: "bookmarks", column: "user_id" },
      { table: "notifications", column: "user_id" },
      { table: "referrals", column: "referrer_id" },
      { table: "referrals", column: "referred_user_id" },
      { table: "helper_reviews", column: "seeker_id" },
      { table: "helper_reviews", column: "helper_id" },
      { table: "reviews", column: "reviewer_user_id" },
      { table: "reviews", column: "reviewee_user_id" },
      { table: "job_hires", column: "seeker_user_id" },
      { table: "job_hires", column: "helper_user_id" },
      { table: "hires", column: "helper_id" },
      { table: "hires", column: "seeker_id" },
      { table: "interviews", column: "seeker_user_id" },
      { table: "interviews", column: "helper_user_id" },
      { table: "conversations", column: "seeker_user_id" },
      { table: "conversations", column: "helper_user_id" },
      { table: "reports", column: "reporter_user_id" },
      { table: "reports", column: "reported_user_id" },
      { table: "verification_requests", column: "user_id" },
      { table: "verification_payments", column: "user_id" },
      { table: "featured_payments", column: "user_id" },
      { table: "profile_analytics", column: "user_id" },
      { table: "response_metrics", column: "user_id" },
      { table: "helper_subscriptions", column: "user_id" },
      { table: "seeker_subscriptions", column: "user_id" },
      { table: "helper_details", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      { table: "profiles", column: "user_id" },
    ];

    for (const { table, column } of tablesToClean) {
      await adminClient.from(table).delete().eq(column, userId);
    }

    // Delete storage files
    const buckets = ["avatars", "helper-videos", "identity-documents"];
    for (const bucket of buckets) {
      const { data: files } = await adminClient.storage
        .from(bucket)
        .list(userId);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${userId}/${f.name}`);
        await adminClient.storage.from(bucket).remove(paths);
      }
    }

    // Finally delete the auth user
    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: "Failed to delete account" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
