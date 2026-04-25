import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Country-specific pricing (in cents) for each boost plan
const COUNTRY_PRICING: Record<string, { currency: string; boost_7: number; boost_21: number; boost_30: number }> = {
  "South Africa": { currency: "ZAR", boost_7: 4900, boost_21: 9900, boost_30: 13900 },
  "Nigeria": { currency: "NGN", boost_7: 400000, boost_21: 800000, boost_30: 1100000 },
  "Kenya": { currency: "KES", boost_7: 50000, boost_21: 100000, boost_30: 140000 },
  "Ghana": { currency: "GHS", boost_7: 5000, boost_21: 10000, boost_30: 14000 },
};
const DEFAULT_PRICING = { currency: "USD", boost_7: 300, boost_21: 600, boost_30: 800 };

const PLAN_DAYS: Record<string, number> = {
  "7_days": 7,
  "21_days": 21,
  "30_days": 30,
};

function getPricing(country: string | null | undefined) {
  if (country && COUNTRY_PRICING[country]) return COUNTRY_PRICING[country];
  return DEFAULT_PRICING;
}

function getBoostAmount(pricing: typeof DEFAULT_PRICING, plan: string): number {
  if (plan === "7_days") return pricing.boost_7;
  if (plan === "21_days") return pricing.boost_21;
  if (plan === "30_days") return pricing.boost_30;
  return 0;
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

    // Verify user is a helper
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "helper")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only helpers can purchase boosts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, reference, plan } = body;

    if (action === "initialize") {
      const days = PLAN_DAYS[plan];
      if (!days) {
        return new Response(JSON.stringify({ error: "Invalid plan" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userCountry = user.user_metadata?.country as string | undefined;
      const pricing = getPricing(userCountry);
      const amount = getBoostAmount(pricing, plan);

      console.log("Initializing featured boost for user:", user.id, "plan:", plan, "currency:", pricing.currency, "amount:", amount);

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount,
          currency: pricing.currency,
          metadata: {
            user_id: user.id,
            plan,
            feature_type: "featured_boost",
          },
        }),
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

      const { error: insertError } = await supabase
        .from("featured_payments")
        .insert({
          user_id: user.id,
          amount: amount / 100,
          plan,
          payment_reference: paystackData.data.reference,
          status: "pending",
          currency: pricing.currency,
          payment_country: userCountry || "South Africa",
        });

      if (insertError) {
        console.error("DB insert error:", insertError.message);
        return new Response(JSON.stringify({ error: insertError.message }), {
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
        const { data: paymentRecord } = await supabase
          .from("featured_payments")
          .select("plan")
          .eq("payment_reference", reference)
          .eq("user_id", user.id)
          .maybeSingle();

        const selectedPlan = paymentRecord?.plan || "7_days";
        const days = PLAN_DAYS[selectedPlan] || 7;
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + days);

        await supabase
          .from("featured_payments")
          .update({ status: "paid" })
          .eq("payment_reference", reference)
          .eq("user_id", user.id);

        await supabase
          .from("helper_details")
          .update({
            is_featured: true,
            featured_until: featuredUntil.toISOString(),
            featured_status: "active",
            featured_type: selectedPlan,
          })
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ success: true, status: "paid", featured_until: featuredUntil.toISOString() }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        await supabase
          .from("featured_payments")
          .update({ status: "failed" })
          .eq("payment_reference", reference)
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
