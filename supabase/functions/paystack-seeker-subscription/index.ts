import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Country-specific pricing (in cents) and Paystack currency
const COUNTRY_PRICING: Record<string, { currency: string; amount: number }> = {
  "South Africa": { currency: "ZAR", amount: 2500 },
  "Nigeria": { currency: "NGN", amount: 200000 },
  "Kenya": { currency: "KES", amount: 25000 },
  "Ghana": { currency: "GHS", amount: 2500 },
};
const DEFAULT_PRICING = { currency: "USD", amount: 200 };

const PLAN_DAYS = 30;

function getPricing(country: string | null | undefined) {
  if (country && COUNTRY_PRICING[country]) return COUNTRY_PRICING[country];
  return DEFAULT_PRICING;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || Deno.env.get("Paystack_Secret_Key");
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

    // Verify user is a seeker or admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["seeker", "admin"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Only seekers can purchase messaging access" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, reference } = body;

    if (action === "initialize") {
      console.log("Initializing seeker subscription for user:", user.id);

      const userCountry = user.user_metadata?.country as string | undefined;
      const pricing = getPricing(userCountry);

      const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/+$/, "") || "";
      const callbackUrl = origin ? `${origin}/dashboard` : "";

      const initBody: Record<string, unknown> = {
        email: user.email,
        amount: pricing.amount,
        currency: pricing.currency,
        metadata: {
          user_id: user.id,
          feature_type: "seeker_subscription",
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

      await supabase
        .from("seeker_subscriptions")
        .update({
          status: "pending",
          amount: pricing.amount / 100,
          currency: pricing.currency,
          payment_country: userCountry || "South Africa",
          payment_reference: paystackData.data.reference,
        })
        .eq("user_id", user.id);

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
          .from("seeker_subscriptions")
          .update({
            status: "active",
            amount: paystackData.data.amount / 100,
            payment_reference: reference,
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
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
        await supabase
          .from("seeker_subscriptions")
          .update({ status: "failed" })
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ success: false, status: "failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error:", (err instanceof Error ? err.message : String(err)));
    return new Response(JSON.stringify({ error: (err instanceof Error ? err.message : String(err)) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
