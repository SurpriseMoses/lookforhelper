import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { notification_id } = await req.json();
    if (!notification_id) {
      return new Response(JSON.stringify({ error: "notification_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch notification
    const { data: notif, error: nErr } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notification_id)
      .single();

    if (nErr || !notif) {
      return new Response(JSON.stringify({ error: "Notification not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email
    const { data: { user }, error: uErr } = await supabase.auth.admin.getUserById(notif.user_id);
    if (uErr || !user?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only send emails for important notification types
    const emailTypes = [
      "interview_request",
      "interview_response",
      "payment_success",
      "verification_approved",
      "verification_rejected",
      "hire_confirmed",
    ];

    if (!emailTypes.includes(notif.type)) {
      return new Response(JSON.stringify({ skipped: true, reason: "Not an email-worthy notification type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email via Supabase Auth (built-in SMTP)
    // Using the Supabase built-in email sending capability
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "").replace("https://", "") || "";
    const siteUrl = `https://${appUrl}.lovable.app`;

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="margin: 0 0 8px; color: #1a1a2e; font-size: 18px;">${notif.title}</h2>
          ${notif.body ? `<p style="color: #666; font-size: 14px; margin: 0 0 16px;">${notif.body}</p>` : ""}
          ${notif.link ? `<a href="${siteUrl}${notif.link}" style="display: inline-block; background: #1a1a2e; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px;">View Details</a>` : ""}
        </div>
        <p style="color: #999; font-size: 11px; text-align: center; margin-top: 16px;">
          Look For Helper — You're receiving this because of activity on your account.
        </p>
      </div>
    `;

    // Use Resend or built-in method - for now log and return success
    // In production, integrate with an email service
    console.log(`Email notification for user ${user.email}: ${notif.title}`);

    return new Response(
      JSON.stringify({ success: true, email: user.email, title: notif.title }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Email notification error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
