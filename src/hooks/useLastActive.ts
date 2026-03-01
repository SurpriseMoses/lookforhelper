import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Updates the user's last_active_at timestamp periodically.
 * Call this once in a top-level component (e.g. App or Dashboard).
 */
const useLastActive = () => {
  const { user } = useAuth();
  const lastUpdate = useRef(0);

  useEffect(() => {
    if (!user) return;

    const update = async () => {
      const now = Date.now();
      // Throttle to once every 5 minutes
      if (now - lastUpdate.current < 5 * 60 * 1000) return;
      lastUpdate.current = now;
      await supabase.rpc("update_last_active");
    };

    // Update on mount (page load / dashboard open)
    update();

    // Also update on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user]);
};

export default useLastActive;
