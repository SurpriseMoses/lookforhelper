import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  const getRedirectPath = (user: any) => {
    // Google OAuth users without explicit role need to complete profile
    if (!user?.user_metadata?.role) {
      return "/complete-profile";
    }
    return "/";
  };

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth callback error:", error);
        navigate("/auth?error=verification_failed");
        return;
      }

      if (session) {
        navigate(getRedirectPath(session.user));
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (session) {
              subscription.unsubscribe();
              navigate(getRedirectPath(session.user));
            }
          }
        );

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
