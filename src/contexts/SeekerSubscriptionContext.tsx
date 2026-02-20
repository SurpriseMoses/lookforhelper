import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SeekerSubContextType {
  hasActiveSubscription: boolean;
  loading: boolean;
  expiresAt: string | null;
  refresh: () => Promise<void>;
}

const SeekerSubscriptionContext = createContext<SeekerSubContextType>({
  hasActiveSubscription: false,
  loading: true,
  expiresAt: null,
  refresh: async () => {},
});

export const useSeekerSubscription = () => useContext(SeekerSubscriptionContext);

export const SeekerSubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || role !== "seeker") {
      setHasActiveSubscription(false);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("seeker_subscriptions")
      .select("status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data && data.status === "active" && data.current_period_end) {
      const isActive = new Date(data.current_period_end) > new Date();
      setHasActiveSubscription(isActive);
      setExpiresAt(data.current_period_end);
    } else {
      setHasActiveSubscription(false);
      setExpiresAt(null);
    }
    setLoading(false);
  }, [user, role]);

  // Verify pending Paystack payment on return (runs globally on any page)
  useEffect(() => {
    if (!user || role !== "seeker") return;
    const ref = localStorage.getItem("seeker_sub_ref");
    if (!ref) return;

    localStorage.removeItem("seeker_sub_ref");

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paystack-seeker-subscription", {
          body: { action: "verify", reference: ref },
        });
        if (error) throw error;
        if (data?.success) {
          toast({ title: "Messaging unlocked!", description: "You now have 30 days of messaging access." });
          await refresh();
        } else {
          toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
        }
      } catch (err: any) {
        toast({ title: "Verification error", description: err.message, variant: "destructive" });
      }
    };

    verifyPayment();
  }, [user, role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SeekerSubscriptionContext.Provider value={{ hasActiveSubscription, loading, expiresAt, refresh }}>
      {children}
    </SeekerSubscriptionContext.Provider>
  );
};
