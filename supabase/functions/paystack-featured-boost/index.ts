import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLANS: Record<string, { amount: number; days: number; label: string }> = {
  "7_days": { amount: 4900, days: 7, label: "7 Days Featured" },
  "30_days": { amount: 9900, days: 30, label: "30 Days Featured" },
};

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

    // Validate auth
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
      const planConfig = PLANS[plan];
      if (!planConfig) {
        return new Response(JSON.stringify({ error: "Invalid plan" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Initializing featured boost for user:", user.id, "plan:", plan);

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: planConfig.amount,
          currency: "ZAR",
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

      // Insert payment record
      const { error: insertError } = await supabase
        .from("featured_payments")
        .insert({
          user_id: user.id,
          amount: planConfig.amount / 100,
          plan,
          payment_reference: paystackData.data.reference,
          status: "pending",
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
        // Get payment record to find plan
        const { data: paymentRecord } = await supabase
          .from("featured_payments")
          .select("plan")
          .eq("payment_reference", reference)
          .eq("user_id", user.id)
          .maybeSingle();

        const selectedPlan = paymentRecord?.plan || "7_days";
        const planConfig = PLANS[selectedPlan];
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + planConfig.days);

        // Update payment status
        await supabase
          .from("featured_payments")
          .update({ status: "paid" })
          .eq("payment_reference", reference)
          .eq("user_id", user.id);

        // Update helper_details
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
    console.error("Unhandled error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
