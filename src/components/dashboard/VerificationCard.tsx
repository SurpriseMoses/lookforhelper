import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Clock, CheckCircle, XCircle, Loader2, CreditCard } from "lucide-react";
import VerificationFlow from "@/components/verification/VerificationFlow";
import { useUserCurrency } from "@/hooks/useUserCurrency";

const HELPER_DOC_TYPE_LABELS: Record<string, string> = {
  sa_id: "SA Verified",
  passport: "Passport Verified",
  work_permit: "Permit Verified",
  asylum_permit: "Permit Verified",
  other: "Verified",
};

const SEEKER_DOC_TYPE_LABELS: Record<string, string> = {
  sa_id: "Verified Employer",
  passport: "Verified Employer",
  work_permit: "Verified Employer",
  asylum_permit: "Verified Employer",
  other: "Verified Employer",
};

interface VerificationRequest {
  id: string;
  status: string;
  rejection_reason: string | null;
  document_url: string;
  payment_id: string | null;
  document_type: string | null;
}

interface VerificationPayment {
  id: string;
  status: string;
}

const VerificationCard = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useUserCurrency();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [payment, setPayment] = useState<VerificationPayment | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);

  useEffect(() => {
    if (user) loadStatus();
  }, [user]);

  // Check for returning from Paystack payment
  useEffect(() => {
    const ref = localStorage.getItem("verification_payment_ref");
    if (!ref || !user) return;

    const verifyPayment = async () => {
      localStorage.removeItem("verification_payment_ref");
      try {
        const { data, error } = await supabase.functions.invoke("paystack-verify-payment", {
          body: { action: "verify", reference: ref },
        });
        if (error) throw error;
        if (data.success) {
          toast({ title: "Payment successful!", description: "Your identity has been verified." });
          loadStatus();
        } else {
          toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
        }
      } catch (err: any) {
        toast({ title: "Verification error", description: err.message, variant: "destructive" });
      }
    };
    verifyPayment();
  }, [user]);

  const loadStatus = async () => {
    if (!user) return;
    const [{ data: requests }, { data: payments }, { data: profile }] = await Promise.all([
      supabase
        .from("verification_requests")
        .select("id, status, rejection_reason, document_url, payment_id, document_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("verification_payments")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .limit(1),
      supabase
        .from("profiles")
        .select("is_verified")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    setRequest(requests?.[0] ?? null);
    setPayment(payments?.[0] ?? null);
    setIsVerified(profile?.is_verified ?? false);
    setLoading(false);
  };

  const handlePay = async () => {
    if (!user) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-verify-payment", {
        body: { action: "initialize" },
      });
      if (error) throw error;
      localStorage.setItem("verification_payment_ref", data.reference);
      window.location.href = data.authorization_url;
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
      setPaying(false);
    }
  };

  if (loading) return null;

  const isSeeker = role === "seeker" || role === "admin";
  const docLabels = isSeeker ? SEEKER_DOC_TYPE_LABELS : HELPER_DOC_TYPE_LABELS;
  const verifiedLabel = docLabels[request?.document_type ?? "sa_id"] ?? (isSeeker ? "Verified Employer" : "Verified Helper");

  // Already verified
  if (isVerified) {
    return (
      <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-5 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="font-medium text-foreground">{verifiedLabel}</p>
            <p className="text-sm text-muted-foreground">
              {isSeeker
                ? "Your identity has been verified. Helpers can see a trusted employer badge on your profile."
                : "Your identity has been verified. Families can see a trusted badge on your profile."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Trust & Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* No request yet OR rejected — start flow */}
          {(!request || request.status === "rejected") && (
            <div className="space-y-3">
              {request?.status === "rejected" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <XCircle className="h-4 w-4" /> Verification Rejected
                  </div>
                  {request.rejection_reason && (
                    <p className="text-sm text-muted-foreground mt-1">{request.rejection_reason}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">You can re-submit your documents below.</p>
                </div>
              )}

              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div>
                  <p className="font-medium text-foreground">Get Verified — {formatPrice("verification")} once-off</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verify your identity using your ID, passport, work permit, or asylum permit. 
                    Both citizens and foreign nationals are welcome.
                    <span className="font-medium text-foreground"> You'll only be charged {formatAmount(49)} once approved.</span>
                  </p>
                </div>

                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">How it works:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Select your document type & upload it</li>
                    <li>Take a live selfie for identity matching</li>
                    <li>Our team reviews your submission (1-2 business days)</li>
                    <li>If approved, pay {formatAmount(49)} to complete verification</li>
                  </ol>
                </div>

                <Button onClick={() => setFlowOpen(true)} className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Get Verified
                </Button>
              </div>
            </div>
          )}

          {/* Pending review */}
          {request && request.status === "pending" && (
            <div className="rounded-lg border bg-amber-50/50 border-amber-200 p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-foreground">Verification In Progress</p>
                <p className="text-sm text-muted-foreground">Our team is reviewing your documents. This usually takes 1-2 business days.</p>
              </div>
            </div>
          )}

          {/* Approved — pay to complete */}
          {request && request.status === "approved" && !payment && !isVerified && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <p className="font-medium text-foreground">Documents Approved!</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Your documents have been approved. Pay {formatAmount(49)} to complete verification and get your badge.
              </p>
              <Button onClick={handlePay} disabled={paying} className="gap-2">
                {paying ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard className="h-4 w-4" /> Pay {formatAmount(49)} & Complete Verification</>
                )}
              </Button>
            </div>
          )}

          {/* Paid but profile not yet updated */}
          {request && request.status === "approved" && payment && !isVerified && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="font-medium text-foreground">Your identity has been verified!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <VerificationFlow open={flowOpen} onOpenChange={setFlowOpen} onComplete={loadStatus} />
    </>
  );
};

export default VerificationCard;
