import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICING: Record<string, { currency: string; amount: number }> = {
  "South Africa": { currency: "ZAR", amount: 3000 },
  "Nigeria": { currency: "NGN", amount: 250000 },
  "Kenya": { currency: "KES", amount: 30000 },
  "Ghana": { currency: "GHS", amount: 3000 },
};
const DEFAULT = { currency: "USD", amount: 200 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || Deno.env.get("Paystack_Secret_Key");
    if (!PAYSTACK_SECRET_KEY) return new Response(JSON.stringify({ error: "Paystack not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: inst } = await supabase.from("institutions").select("id, country, verification_status").eq("user_id", user.id).maybeSingle();
    if (!inst || inst.verification_status !== "verified") {
      return new Response(JSON.stringify({ error: "Only verified institutions can post extra announcements" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pricing = PRICING[inst.country] || DEFAULT;
    const body = await req.json();
    const { action, reference } = body;

    if (action === "initialize") {
      const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/+$/, "") || "";
      const callback_url = origin ? `${origin}/institution-dashboard` : undefined;
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email, amount: pricing.amount, currency: pricing.currency, callback_url,
          metadata: { user_id: user.id, institution_id: inst.id, type: "institution_announcement" },
        }),
      });
      const d = await res.json();
      if (!d.status) return new Response(JSON.stringify({ error: d.message || "Init failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await supabase.from("institution_payments").insert({
        institution_id: inst.id, user_id: user.id, amount: pricing.amount / 100, currency: pricing.currency,
        payment_type: "extra_announcement", payment_status: "pending", payment_reference: d.data.reference, payment_country: inst.country,
      });
      return new Response(JSON.stringify({ authorization_url: d.data.authorization_url, reference: d.data.reference }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "verify") {
      if (!reference) return new Response(JSON.stringify({ error: "Reference required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } });
      const d = await res.json();
      if (d.status && d.data.status === "success") {
        await supabase.from("institution_payments").update({ payment_status: "paid" }).eq("payment_reference", reference);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await supabase.from("institution_payments").update({ payment_status: "failed" }).eq("payment_reference", reference);
      return new Response(JSON.stringify({ success: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
