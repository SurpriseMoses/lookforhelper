import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Eye, Search, MessageSquare, Briefcase, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";

interface Analytics {
  profile_views_last_7_days: number;
  search_appearances_last_7_days: number;
  messages_received_last_7_days: number;
}

interface StrengthItem {
  label: string;
  done: boolean;
  points: number;
}

const HelperPerformanceCard = () => {
  const { user, role } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [hireCount, setHireCount] = useState(0);
  const [strength, setStrength] = useState<StrengthItem[]>([]);
  const [strengthScore, setStrengthScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== "helper") return;

    const load = async () => {
      // Fetch analytics
      const { data: analyticsData } = await supabase
        .from("profile_analytics")
        .select("profile_views_last_7_days, search_appearances_last_7_days, messages_received_last_7_days")
        .eq("user_id", user.id)
        .maybeSingle();

      setAnalytics(analyticsData ?? { profile_views_last_7_days: 0, search_appearances_last_7_days: 0, messages_received_last_7_days: 0 });

      // Fetch hire count
      const { count } = await supabase
        .from("hires")
        .select("id", { count: "exact", head: true })
        .eq("helper_id", user.id)
        .eq("status", "confirmed");
      setHireCount(count ?? 0);

      // Calculate profile strength
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, is_verified")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: details } = await supabase
        .from("helper_details")
        .select("skills, about_me, availability_status, background_check_status")
        .eq("user_id", user.id)
        .maybeSingle();

      const items: StrengthItem[] = [
        { label: "Add profile photo", done: !!profile?.avatar_url, points: 20 },
        { label: "Add skills", done: !!(details?.skills && details.skills.length > 0), points: 20 },
        { label: "Write about section", done: !!(details?.about_me && details.about_me.length > 10), points: 20 },
        { label: "Set availability", done: details?.availability_status !== "not_available", points: 10 },
        { label: "Complete verification", done: !!profile?.is_verified, points: 20 },
        { label: "Background check approved", done: details?.background_check_status === "approved", points: 10 },
      ];

      setStrength(items);
      setStrengthScore(items.filter((i) => i.done).reduce((sum, i) => sum + i.points, 0));
      setLoading(false);
    };

    load();
  }, [user, role]);

  if (!user || role !== "helper" || loading) return null;

  const stats = analytics ?? { profile_views_last_7_days: 0, search_appearances_last_7_days: 0, messages_received_last_7_days: 0 };
  const incomplete = strength.filter((i) => !i.done);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Profile Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.profile_views_last_7_days}</p>
            <p className="text-xs text-muted-foreground">Profile views (7d)</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Search className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.search_appearances_last_7_days}</p>
            <p className="text-xs text-muted-foreground">Search appearances (7d)</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <MessageSquare className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.messages_received_last_7_days}</p>
            <p className="text-xs text-muted-foreground">Messages received (7d)</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Briefcase className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{hireCount}</p>
            <p className="text-xs text-muted-foreground">Total hires</p>
          </div>
        </div>

        {/* Profile strength */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-foreground">Profile strength</span>
            <span className="text-sm font-bold text-foreground">{strengthScore}%</span>
          </div>
          <Progress value={strengthScore} className="h-2.5" />
        </div>

        {/* Tips */}
        {incomplete.length > 0 && strengthScore < 80 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-900 mb-1.5">Tips to improve your profile:</p>
            <ul className="space-y-1">
              {incomplete.map((item) => (
                <li key={item.label} className="text-xs text-amber-800 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-amber-500" />
                  {item.label} (+{item.points}%)
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Monetization CTA */}
        <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-4 text-center">
          <Zap className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-sm font-medium text-foreground">Boost your profile to reach more seekers</p>
          <Button asChild size="sm" className="mt-2">
            <Link to="/dashboard#featured-boost">Get Featured Boost</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelperPerformanceCard;
