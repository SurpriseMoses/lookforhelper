import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSeekerSubscription } from "@/contexts/SeekerSubscriptionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, CheckCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import SeekerPaywallDialog from "@/components/subscription/SeekerPaywallDialog";

const SeekerSubscriptionCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasActiveSubscription, expiresAt, loading, refresh } = useSeekerSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  // Check for returning from Paystack
  useEffect(() => {
    const ref = localStorage.getItem("seeker_sub_ref");
    if (ref && user) {
      localStorage.removeItem("seeker_sub_ref");
      verifyPayment(ref);
    }
  }, [user]);

  const verifyPayment = async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("paystack-seeker-subscription", {
        body: { action: "verify", reference },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Messaging unlocked!", description: "You now have 30 days of messaging access." });
        refresh();
      } else {
        toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Verification error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return null;

  const daysRemaining = expiresAt ? Math.max(0, differenceInDays(new Date(expiresAt), new Date())) : 0;

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messaging Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasActiveSubscription ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
                  <CheckCircle className="h-3 w-3" /> Active
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="h-3 w-3" />
                  Expires {expiresAt ? format(new Date(expiresAt), "MMM d, yyyy") : "—"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining. You have full messaging access.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Unlock messaging to contact helpers, schedule interviews, and make hires.
              </p>
              <Button onClick={() => setShowPaywall(true)} className="gap-2">
                <MessageSquare className="h-4 w-4" /> Unlock Messaging — R25
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SeekerPaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  );
};

export default SeekerSubscriptionCard;
