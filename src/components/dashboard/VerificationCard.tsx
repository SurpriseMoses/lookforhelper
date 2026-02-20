import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Upload, Clock, CheckCircle, XCircle, Loader2, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VerificationPayment {
  id: string;
  status: string;
  payment_reference: string | null;
}

interface VerificationRequest {
  id: string;
  status: string;
  rejection_reason: string | null;
  document_url: string;
}

const VerificationCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [payment, setPayment] = useState<VerificationPayment | null>(null);
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) loadStatus();
  }, [user]);

  const loadStatus = async () => {
    if (!user) return;

    const [{ data: payments }, { data: requests }, { data: profile }] = await Promise.all([
      supabase
        .from("verification_payments")
        .select("id, status, payment_reference")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .limit(1),
      supabase
        .from("verification_requests")
        .select("id, status, rejection_reason, document_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("profiles")
        .select("is_verified")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    setPayment(payments?.[0] ?? null);
    setRequest(requests?.[0] ?? null);
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

      // Store reference for verification after redirect
      localStorage.setItem("verification_payment_ref", data.reference);

      // Redirect to Paystack
      window.location.href = data.authorization_url;
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
      setPaying(false);
    }
  };

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
          toast({ title: "Payment successful!", description: "You can now upload your ID document." });
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

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !payment) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10 MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("identity-documents").upload(path, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // Create signed URL or just store the path
    const documentUrl = path;

    const { error: insertError } = await supabase.from("verification_requests").insert({
      user_id: user.id,
      payment_id: payment.id,
      document_url: documentUrl,
      status: "pending",
    });

    if (insertError) {
      toast({ title: "Failed to submit", description: insertError.message, variant: "destructive" });
    } else {
      toast({ title: "Document submitted!", description: "Our team will review it shortly." });
      loadStatus();
    }
    setUploading(false);
  };

  if (loading) return null;

  // Already verified
  if (isVerified) {
    return (
      <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-5 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="font-medium text-foreground">Verified Identity</p>
            <p className="text-sm text-muted-foreground">Your identity has been verified. Families can see a trusted badge on your profile.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Trust & Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Payment */}
        {!payment && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div>
              <p className="font-medium text-foreground">Get Verified Identity — R49 once-off</p>
              <p className="text-sm text-muted-foreground mt-1">
                Our team will review your government ID to confirm your identity and help families trust your profile.
              </p>
            </div>
            <Button onClick={handlePay} disabled={paying} className="gap-2">
              {paying ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                "Pay R49 & Get Verified"
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Upload document (payment done, no request yet or rejected) */}
        {payment && (!request || request.status === "rejected") && (
          <div className="space-y-3">
            {request?.status === "rejected" && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <XCircle className="h-4 w-4" /> Verification Rejected
                </div>
                {request.rejection_reason && (
                  <p className="text-sm text-muted-foreground mt-1">{request.rejection_reason}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">You can re-upload your document below.</p>
              </div>
            )}

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div>
                <p className="font-medium text-foreground">Upload Your ID Document</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a clear photo of your South African ID, passport, or driver's license. Max 10 MB.
                </p>
              </div>
              <div>
                <Label htmlFor="id-upload" className="cursor-pointer">
                  <Button asChild disabled={uploading} variant="outline" className="gap-2">
                    <span>
                      {uploading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="h-4 w-4" /> Choose File</>
                      )}
                    </span>
                  </Button>
                </Label>
                <input
                  id="id-upload"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleUploadDocument}
                  disabled={uploading}
                />
              </div>
              <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
                <Home className="h-4 w-4" /> Go to Home
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Pending review */}
        {payment && request && request.status === "pending" && (
          <div className="rounded-lg border bg-amber-50/50 border-amber-200 p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-foreground">Verification Pending Review</p>
              <p className="text-sm text-muted-foreground">Our team is reviewing your document. This usually takes 1-2 business days.</p>
            </div>
          </div>
        )}

        {/* Approved but profile not yet updated (shouldn't normally happen) */}
        {payment && request && request.status === "approved" && !isVerified && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <p className="font-medium text-foreground">Your identity has been verified!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationCard;
