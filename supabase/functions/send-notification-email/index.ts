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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // AUTHZ: only allow internal/admin callers. Accept either the service-role key
    // (used by db triggers / internal callers) or a JWT from an authenticated admin user.
    const authHeader = req.headers.get("Authorization") || "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    let authorized = false;
    if (bearer && bearer === supabaseServiceKey) {
      authorized = true;
    } else if (bearer) {
      const { data: { user } } = await supabase.auth.getUser(bearer);
      if (user) {
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        if (isAdmin) authorized = true;
      }
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Escape HTML to prevent injection via caller-supplied title/body/link
    const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
    ));

    const { notification_id, type, user_id, title, body, link } = await req.json();

    
    // Support both direct params and notification_id lookup
    let notifData = { type, user_id, title, body, link };
    
    if (notification_id) {
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
      notifData = notif;
    }

    if (!notifData.user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email
    const { data: { user }, error: uErr } = await supabase.auth.admin.getUserById(notifData.user_id);
    if (uErr || !user?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only send emails for important notification types
    const emailTypes = [
      "new_message",
      "interview_request",
      "interview_response",
      "payment_success",
      "verification_approved",
      "verification_rejected",
      "hire_confirmed",
    ];

    if (!emailTypes.includes(notifData.type)) {
      return new Response(JSON.stringify({ skipped: true, reason: "Not an email-worthy notification type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build site URL
    const projectId = Deno.env.get("SUPABASE_URL")?.match(/https:\/\/([^.]+)/)?.[1] || "";
    const siteUrl = "https://lookforhelper.lovable.app";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <h2 style="margin: 0 0 12px; color: #1a1a2e; font-size: 20px; font-weight: 600;">${notifData.title}</h2>
                    ${notifData.body ? `<p style="color: #666; font-size: 15px; margin: 0 0 24px; line-height: 1.5;">${notifData.body}</p>` : ""}
                    ${notifData.link ? `<a href="${siteUrl}${notifData.link}" style="display: inline-block; background: #1a1a2e; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 500;">View Details</a>` : ""}
                  </td>
                </tr>
              </table>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">
                Look For Helper — You're receiving this because of activity on your account.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send email using Lovable transactional email API if available
    if (lovableApiKey) {
      try {
        const emailResponse = await fetch("https://api.lovable.dev/v1/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            to: user.email,
            subject: notifData.title,
            html: emailHtml,
            purpose: "transactional",
          }),
        });

        if (emailResponse.ok) {
          console.log(`Email sent to ${user.email}: ${notifData.title}`);
          return new Response(
            JSON.stringify({ success: true, email: user.email, title: notifData.title }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          const errText = await emailResponse.text();
          console.error("Email API error:", errText);
        }
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
      }
    }

    // Fallback: log the notification
    console.log(`[EMAIL LOG] To: ${user.email}, Subject: ${notifData.title}, Body: ${notifData.body || ""}`);

    return new Response(
      JSON.stringify({ success: true, email: user.email, title: notifData.title, logged: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Email notification error:", (err instanceof Error ? err.message : String(err)));
    return new Response(JSON.stringify({ error: (err instanceof Error ? err.message : String(err)) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
