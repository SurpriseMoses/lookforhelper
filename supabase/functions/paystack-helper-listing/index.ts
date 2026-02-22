import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_AMOUNT = 2500; // R25 in cents
const PLAN_DAYS = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Paystack not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is a helper
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "helper")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only helpers can activate listing" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, reference } = body;

    if (action === "initialize") {
      console.log("Initializing helper listing for user:", user.id);

      const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/+$/, "") || "";
      const callbackUrl = origin ? `${origin}/dashboard` : "";

      const initBody: Record<string, unknown> = {
        email: user.email,
        amount: PLAN_AMOUNT,
        currency: "ZAR",
        metadata: {
          user_id: user.id,
          feature_type: "helper_listing",
        },
      };
      if (callbackUrl) {
        initBody.callback_url = callbackUrl;
      }

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(initBody),
      });

      const rawText = await paystackRes.text();
      let paystackData;
      try {
        paystackData = JSON.parse(rawText);
      } catch {
        return new Response(JSON.stringify({ error: "Invalid response from payment provider" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!paystackData.status) {
        return new Response(JSON.stringify({ error: paystackData.message || "Failed to initialize payment" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          authorization_url: paystackData.data.authorization_url,
          reference: paystackData.data.reference,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (!reference) {
        return new Response(JSON.stringify({ error: "Reference required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });

      const rawText = await paystackRes.text();
      let paystackData;
      try {
        paystackData = JSON.parse(rawText);
      } catch {
        return new Response(JSON.stringify({ error: "Invalid response from payment provider" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (paystackData.status && paystackData.data.status === "success") {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + PLAN_DAYS);

        await supabase
          .from("helper_subscriptions")
          .update({
            status: "active",
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            featured_active: true,
            featured_expires_at: endDate.toISOString(),
            featured_cancelled: false,
            featured_cancelled_at: null,
          })
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({
            success: true,
            status: "active",
            current_period_end: endDate.toISOString(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, status: "failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "cancel") {
      // Cancel subscription - keep active until expiry
      const { data: sub } = await supabase
        .from("helper_subscriptions")
        .select("featured_expires_at, featured_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!sub || !sub.featured_active) {
        return new Response(JSON.stringify({ error: "No active listing to cancel" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("helper_subscriptions")
        .update({
          featured_cancelled: true,
          featured_cancelled_at: new Date().toISOString(),
          status: "cancelled",
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          success: true,
          featured_expires_at: sub.featured_expires_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reactivate") {
      const { data: sub } = await supabase
        .from("helper_subscriptions")
        .select("featured_cancelled, featured_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!sub || !sub.featured_cancelled) {
        return new Response(JSON.stringify({ error: "No cancelled subscription to reactivate" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("helper_subscriptions")
        .update({
          featured_cancelled: false,
          featured_cancelled_at: null,
          status: "active",
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
