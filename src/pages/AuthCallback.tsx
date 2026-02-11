import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase will detect tokens in the URL hash automatically
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth callback error:", error);
        navigate("/auth?error=verification_failed");
        return;
      }

      if (session) {
        navigate("/dashboard");
      } else {
        // Session not ready yet — listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (session) {
              subscription.unsubscribe();
              navigate("/dashboard");
            }
          }
        );

        // Timeout fallback
        setTimeout(() => {
          subscription.unsubscribe();
          navigate("/auth?tab=login");
        }, 5000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Verifying your account...</p>
    </div>
  );
};

export default AuthCallback;
