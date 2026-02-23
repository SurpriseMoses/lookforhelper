import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "seeker" | "helper" | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  profileComplete: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setRole(data?.role ?? null);
  };

  const processReferralCode = async (userId: string) => {
    const code = localStorage.getItem("pending_referral_code");
    if (!code) return;
    localStorage.removeItem("pending_referral_code");

    try {
      // Find referrer by code
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("referral_code", code)
        .maybeSingle();

      if (!referrerProfile || referrerProfile.user_id === userId) return;

      // Update referred_by on the new user's profile
      await supabase
        .from("profiles")
        .update({ referred_by: code })
        .eq("user_id", userId);

      // Create referral record
      await supabase
        .from("referrals")
        .insert({
          referrer_id: referrerProfile.user_id,
          referred_user_id: userId,
          referral_code: code,
        });
    } catch {
      // Silently fail - referral is non-critical
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
          // Use setTimeout to avoid potential deadlocks with Supabase auth
          setTimeout(() => {
            fetchRole(session.user.id);
          }, 0);
          // Process pending referral code after first sign-in
          if (event === 'SIGNED_IN') {
            setTimeout(() => processReferralCode(session.user.id), 500);
          }
        } else if (!session) {
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: selectedRole },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };
  // Profile is complete if the user signed up via email (role in metadata) or has explicitly set role
  const profileComplete = !user || !!user.user_metadata?.role;

  return (
    <AuthContext.Provider value={{ user, session, loading, role, profileComplete, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
