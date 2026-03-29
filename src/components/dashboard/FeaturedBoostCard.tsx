import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Sparkles, Clock } from "lucide-react";
import { format } from "date-fns";
import { useUserCurrency } from "@/hooks/useUserCurrency";

const FeaturedBoostCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatAmount } = useUserCurrency();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [featuredStatus, setFeaturedStatus] = useState<{
    is_featured: boolean;
    featured_until: string | null;
    featured_status: string;
    featured_type: string | null;
  }>({ is_featured: false, featured_until: null, featured_status: "none", featured_type: null });

  useEffect(() => {
    if (!user) return;
    loadStatus();

    // Check for returning from Paystack
    const ref = localStorage.getItem("featured_boost_ref");
    if (ref) {
      localStorage.removeItem("featured_boost_ref");
      verifyPayment(ref);
    }
  }, [user]);

  const loadStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("helper_details")
      .select("is_featured, featured_until, featured_status, featured_type")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      // Check expiry client-side
      const now = new Date();
      const expired = data.featured_until && new Date(data.featured_until) < now;
      setFeaturedStatus({
        is_featured: expired ? false : (data as any).is_featured ?? false,
        featured_until: (data as any).featured_until ?? null,
        featured_status: expired ? "expired" : (data as any).featured_status ?? "none",
        featured_type: (data as any).featured_type ?? null,
      });
    }
    setLoading(false);
  };

  const verifyPayment = async (reference: string) => {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-featured-boost", {
        body: { action: "verify", reference },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Boost activated!", description: "Your profile is now featured." });
        loadStatus();
      } else {
        toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Verification error", description: err.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const handleBoost = async (plan: "7_days" | "21_days" | "30_days") => {
    if (!user) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-featured-boost", {
        body: { action: "initialize", plan },
      });
      if (error) throw error;
      if (data?.authorization_url) {
        localStorage.setItem("featured_boost_ref", data.reference);
        window.location.href = data.authorization_url;
      } else {
        toast({ title: "Error", description: "Could not initialize payment", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  if (loading) return null;

  const isActive = featuredStatus.featured_status === "active" && featuredStatus.is_featured;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Boost Visibility
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isActive ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
                <Star className="h-3 w-3" /> Featured Helper
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                Until {featuredStatus.featured_until ? format(new Date(featuredStatus.featured_until), "MMM d, yyyy") : "—"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Your profile is currently boosted and appears at the top of search results.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {featuredStatus.featured_status === "expired" && (
              <p className="text-sm text-muted-foreground">
                Your previous boost has expired. Renew to stay at the top!
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Boost your profile to appear at the top of search results and get noticed by more employers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleBoost("7_days")}
                disabled={paying}
                className="gap-2"
              >
                <Star className="h-4 w-4" />
                {paying ? "Processing..." : `7 Days — ${formatAmount(49)}`}
              </Button>
              <Button
                onClick={() => handleBoost("21_days")}
                disabled={paying}
                variant="outline"
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Star className="h-4 w-4" />
                {paying ? "Processing..." : "21 Days — R99"}
              </Button>
              <Button
                onClick={() => handleBoost("30_days")}
                disabled={paying}
                variant="outline"
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Star className="h-4 w-4" />
                {paying ? "Processing..." : "30 Days — R139"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeaturedBoostCard;
