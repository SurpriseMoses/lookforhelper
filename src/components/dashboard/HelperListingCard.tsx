import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Clock, AlertTriangle, XCircle } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { useUserCurrency } from "@/hooks/useUserCurrency";

interface ListingStatus {
  status: string;
  trial_start: string;
  trial_end: string;
  current_period_start: string | null;
  current_period_end: string | null;
  featured_active: boolean;
  featured_expires_at: string | null;
  featured_cancelled: boolean;
  featured_cancelled_at: string | null;
}

const HelperListingCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useUserCurrency();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [listing, setListing] = useState<ListingStatus | null>(null);

  useEffect(() => {
    if (!user) return;
    loadStatus();

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
      .select("status, trial_start, trial_end, current_period_start, current_period_end, featured_active, featured_expires_at, featured_cancelled, featured_cancelled_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) setListing(data as ListingStatus);
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

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-helper-listing", {
        body: { action: "cancel" },
      });
      if (error) throw error;
      if (data?.success) {
        toast({
          title: "Subscription cancelled",
          description: "Your listing will remain active until the current period ends.",
        });
        loadStatus();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-helper-listing", {
        body: { action: "reactivate" },
      });
      if (error) throw error;
      if (data?.success) {
        toast({
          title: "Subscription reactivated",
          description: "Your listing will continue after the current period.",
        });
        loadStatus();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setReactivating(false);
    }
  };

  if (loading) return null;

  const now = new Date();
  const isTrialActive = listing ? listing.status === "trial" && !isPast(new Date(listing.trial_end)) : false;
  const isFeaturedActive = listing ? listing.featured_active && listing.featured_expires_at && !isPast(new Date(listing.featured_expires_at)) : false;
  const isCancelled = listing ? listing.featured_cancelled : false;
  const isVisible = isTrialActive || isFeaturedActive;

  const expiryDate = isFeaturedActive && listing
    ? new Date(listing.featured_expires_at!)
    : isTrialActive && listing
    ? new Date(listing.trial_end)
    : null;

  const daysLeft = expiryDate ? differenceInDays(expiryDate, now) : 0;
  const isExpiringSoon = daysLeft <= 5 && daysLeft >= 0;

  // Determine display status
  let statusLabel = "Not Active";
  let statusVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  if (isFeaturedActive && !isCancelled) {
    statusLabel = "Active";
    statusVariant = "default";
  } else if (isFeaturedActive && isCancelled) {
    statusLabel = "Cancelled";
    statusVariant = "outline";
  } else if (isTrialActive) {
    statusLabel = "Free Trial";
    statusVariant = "default";
  }

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
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Your profile is visible to seekers in search results.
              </p>
              <Badge variant={statusVariant} className="text-xs">
                {statusLabel}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {isCancelled ? "Active until" : isTrialActive ? "Free trial ends" : "Next billing date"}:{" "}
                <span className="font-medium">
                  {expiryDate ? format(expiryDate, "dd MMM yyyy") : "—"}
                </span>
                {daysLeft >= 0 && (
                  <span className="text-muted-foreground"> ({daysLeft} days left)</span>
                )}
              </span>
            </div>

            {isCancelled && (
              <div className="flex items-start gap-2 rounded-lg border border-muted bg-muted/50 p-3">
                <XCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Subscription cancelled
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your listing remains visible until {expiryDate ? format(expiryDate, "dd MMM yyyy") : "expiry"}. You will not be charged again.
                  </p>
                </div>
              </div>
            )}

            {isExpiringSoon && isCancelled && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Your visibility ends in {daysLeft} day{daysLeft !== 1 ? "s" : ""} — Reactivate now
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Resume billing to stay visible to seekers.
                  </p>
                </div>
              </div>
            )}

            {isExpiringSoon && !isCancelled && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Expiring soon
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Renew your listing to stay visible. {formatPrice("helper_listing")} for 30 days.
                  </p>
                </div>
              </div>
            )}

            {/* Trial users: activate */}
            {isTrialActive && !isFeaturedActive && (
              <Button onClick={handleActivate} disabled={paying} className="w-full">
                {paying ? "Processing..." : `Activate Listing — ${formatPrice("helper_listing")}/month`}
              </Button>
            )}

            {/* Active + cancelled: reactivate */}
            {isFeaturedActive && isCancelled && (
              <div className="space-y-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full">
                      Reactivate Subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reactivate your subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your automatic billing will resume and your profile will stay visible to seekers after the current period ends. You will be charged {formatPrice("helper_listing")} on the next billing cycle.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Not Now</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleReactivate}
                        disabled={reactivating}
                      >
                        {reactivating ? "Processing..." : "Yes, Reactivate"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-xs text-muted-foreground text-center">
                  Resume automatic billing to keep your profile featured after expiry.
                </p>
              </div>
            )}

            {/* Active + not cancelled: cancel */}
            {isFeaturedActive && !isCancelled && !isTrialActive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel your listing subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your featured listing will remain active until{" "}
                      <span className="font-medium text-foreground">
                        {expiryDate ? format(expiryDate, "dd MMM yyyy") : "the end of your current period"}
                      </span>
                      . You will not be charged again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {cancelling ? "Cancelling..." : "Yes, Cancel"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
              {paying ? "Processing..." : `Subscribe — ${formatPrice("helper_listing")}/month`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HelperListingCard;