import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Country-specific pricing (in cents)
const COUNTRY_PRICING: Record<string, { currency: string; amount: number }> = {
  "South Africa": { currency: "ZAR", amount: 4900 },
  "Nigeria": { currency: "NGN", amount: 400000 },
  "Kenya": { currency: "KES", amount: 50000 },
  "Ghana": { currency: "GHS", amount: 5000 },
};
const DEFAULT_PRICING = { currency: "USD", amount: 300 };

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
      console.error("PAYSTACK_SECRET_KEY is not configured");
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
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, reference } = body;

    if (action === "initialize") {
      console.log("Initializing verification payment for user:", user.id);

      const userCountry = user.user_metadata?.country as string | undefined;
      const pricing = getPricing(userCountry);

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: pricing.amount,
          currency: pricing.currency,
          metadata: {
            user_id: user.id,
            purpose: "identity_verification",
          },
        }),
      });

      const rawText = await paystackRes.text();
      console.log("Paystack response status:", paystackRes.status);

      let paystackData;
      try {
        paystackData = JSON.parse(rawText);
      } catch {
        console.error("Failed to parse Paystack response:", rawText.substring(0, 500));
        return new Response(JSON.stringify({ error: "Invalid response from payment provider" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!paystackData.status) {
        console.error("Paystack error:", paystackData.message || "Unknown error");
        return new Response(JSON.stringify({ error: paystackData.message || "Failed to initialize payment" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: insertError } = await supabase
        .from("verification_payments")
        .insert({
          user_id: user.id,
          amount: pricing.amount / 100,
          status: "pending",
          payment_reference: paystackData.data.reference,
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
        await supabase
          .from("verification_payments")
          .update({ status: "paid" })
          .eq("payment_reference", reference)
          .eq("user_id", user.id);

        await supabase
          .from("profiles")
          .update({ is_verified: true, verified_at: new Date().toISOString() })
          .eq("user_id", user.id);

        const { data: paidPayment } = await supabase
          .from("verification_payments")
          .select("id")
          .eq("payment_reference", reference)
          .eq("user_id", user.id)
          .maybeSingle();

        if (paidPayment) {
          await supabase
            .from("verification_requests")
            .update({ payment_id: paidPayment.id })
            .eq("user_id", user.id)
            .eq("status", "approved");
        }

        return new Response(
          JSON.stringify({ success: true, status: "paid" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        await supabase
          .from("verification_payments")
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
