import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Clock, AlertTriangle } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

interface ListingStatus {
  status: string;
  trial_start: string;
  trial_end: string;
  current_period_start: string | null;
  current_period_end: string | null;
}

const HelperListingCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [listing, setListing] = useState<ListingStatus | null>(null);

  useEffect(() => {
    if (!user) return;
    loadStatus();

    // Check for pending payment reference on return from Paystack
    const ref = localStorage.getItem("helper_listing_ref");
    if (ref) {
      localStorage.removeItem("helper_listing_ref");
      verifyPayment(ref);
    }
  }, [user]);

  const loadStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("helper_subscriptions")
      .select("status, trial_start, trial_end, current_period_start, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) setListing(data);
    setLoading(false);
  };

  const verifyPayment = async (reference: string) => {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-helper-listing", {
        body: { action: "verify", reference },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Listing activated!", description: "Your profile is now visible to seekers." });
        loadStatus();
      } else {
        toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const handleActivate = async () => {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-helper-listing", {
        body: { action: "initialize" },
      });
      if (error) throw error;
      if (data?.authorization_url) {
        localStorage.setItem("helper_listing_ref", data.reference);
        window.location.href = data.authorization_url;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setPaying(false);
    }
  };

  if (loading || !listing) return null;

  const now = new Date();
  const isTrialActive = listing.status === "trial" && !isPast(new Date(listing.trial_end));
  const isActive = listing.status === "active" && listing.current_period_end && !isPast(new Date(listing.current_period_end));
  const isVisible = isTrialActive || isActive;

  const expiryDate = isActive
    ? new Date(listing.current_period_end!)
    : isTrialActive
    ? new Date(listing.trial_end)
    : null;

  const daysLeft = expiryDate ? differenceInDays(expiryDate, now) : 0;
  const isExpiringSoon = daysLeft <= 5 && daysLeft >= 0;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Platform Visibility</CardTitle>
          {isVisible ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
              <Eye className="mr-1 h-3 w-3" /> Visible
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
              <EyeOff className="mr-1 h-3 w-3" /> Hidden
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isVisible ? (
          <>
            <p className="text-sm text-muted-foreground">
              Your profile is visible to seekers in search results.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {isTrialActive ? "Free trial" : "Listing"} expires{" "}
                <span className="font-medium">
                  {expiryDate ? format(expiryDate, "dd MMM yyyy") : "—"}
                </span>
                {daysLeft >= 0 && (
                  <span className="text-muted-foreground"> ({daysLeft} days left)</span>
                )}
              </span>
            </div>
            {isExpiringSoon && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Expiring soon
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Renew your listing to stay visible. R25 for 30 days.
                  </p>
                </div>
              </div>
            )}
            {(isExpiringSoon || isTrialActive) && (
              <Button onClick={handleActivate} disabled={paying} className="w-full">
                {paying ? "Processing..." : isTrialActive ? "Activate Listing — R25/month" : "Renew Listing — R25"}
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="rounded-lg border bg-muted/50 p-4 text-center space-y-2">
              <EyeOff className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">
                Your profile is not visible to seekers
              </p>
              <p className="text-xs text-muted-foreground">
                Activate your listing to appear in search results and get discovered by households looking for helpers.
              </p>
            </div>
            <Button onClick={handleActivate} disabled={paying} className="w-full">
              {paying ? "Processing..." : "Activate Listing — R25/month"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HelperListingCard;
