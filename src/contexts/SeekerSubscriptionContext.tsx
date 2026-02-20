import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SeekerSubscriptionContext.Provider value={{ hasActiveSubscription, loading, expiresAt, refresh }}>
      {children}
    </SeekerSubscriptionContext.Provider>
  );
};
