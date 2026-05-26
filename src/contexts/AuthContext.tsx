import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "seeker" | "helper" | "admin" | "institution";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  profileComplete: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole, country?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const roleRequestIdRef = useRef(0);

  const fetchRole = async (userId: string, fallbackRole?: AppRole | null): Promise<void> => {
    const requestId = ++roleRequestIdRef.current;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (requestId !== roleRequestIdRef.current) return;

    if (error) {
      console.error("Failed to fetch user roles:", error.message);
      setRole((currentRole) => currentRole ?? fallbackRole ?? null);
      return;
    }

    const roles = (data || []).map((r) => r.role as string);
    if (roles.includes("admin")) setRole("admin");
    else if (roles.includes("institution")) setRole("institution");
    else if (roles.includes("helper")) setRole("helper");
    else if (roles.includes("seeker")) setRole("seeker");
    else setRole(fallbackRole ?? null);
  };

  const processReferralCode = async (userId: string) => {
    const code = localStorage.getItem("pending_referral_code");
    if (!code) return;
    localStorage.removeItem("pending_referral_code");

    try {
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("referral_code", code)
        .maybeSingle();

      if (!referrerProfile || referrerProfile.user_id === userId) return;

      await supabase
        .from("profiles")
        .update({ referred_by: code })
        .eq("user_id", userId);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        sessionStorage.setItem("password_recovery_in_progress", "true");
        roleRequestIdRef.current += 1;
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      if (sessionStorage.getItem("password_recovery_in_progress") === "true") {
        roleRequestIdRef.current += 1;
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession) {
        roleRequestIdRef.current += 1;
        setRole(null);
        setLoading(false);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setLoading(true);
        const fallbackRole = (nextSession.user.user_metadata?.role as AppRole | undefined) ?? null;

        setTimeout(() => {
          void fetchRole(nextSession.user.id, fallbackRole).finally(() => {
            if (roleRequestIdRef.current > 0) {
              setLoading(false);
            }
          });
        }, 0);

        if (event === "SIGNED_IN") {
          setTimeout(() => void processReferralCode(nextSession.user.id), 500);
        }
      }
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (sessionStorage.getItem("password_recovery_in_progress") === "true") {
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (!initialSession?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const fallbackRole = (initialSession.user.user_metadata?.role as AppRole | undefined) ?? null;
      void fetchRole(initialSession.user.id, fallbackRole).finally(() => {
        setLoading(false);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole, country?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: selectedRole, country: country || "South Africa" },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;

    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error("An account with this email already exists. Please log in instead.");
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

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
