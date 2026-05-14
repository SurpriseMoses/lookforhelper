import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Star, CheckCircle, Heart, ArrowLeft } from "lucide-react";

interface SavedHelper {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  city: string | null;
  years_experience: number | null;
  skills: string[] | null;
  average_rating: number;
  total_reviews: number;
}

const SavedHelpers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [helpers, setHelpers] = useState<SavedHelper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("helper_user_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!bookmarks || bookmarks.length === 0) {
        setHelpers([]);
        setLoading(false);
        return;
      }

      const ids = bookmarks.map((b) => b.helper_user_id);

      const [{ data: details }, { data: profiles }] = await Promise.all([
        supabase
          .from("helper_details")
          .select("user_id, city, years_experience, skills, average_rating, total_reviews")
          .in("user_id", ids)
          .eq("is_published", true),
        supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, is_verified")
          .in("user_id", ids),
      ]);

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const detailMap = new Map((details ?? []).map((d) => [d.user_id, d]));

      const merged: SavedHelper[] = ids
        .map((id) => {
          const p = profileMap.get(id);
          const d = detailMap.get(id);
          if (!p) return null;
          return {
            user_id: id,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            is_verified: p.is_verified,
            city: d?.city ?? null,
            years_experience: d?.years_experience ?? null,
            skills: d?.skills ?? null,
            average_rating: Number(d?.average_rating) || 0,
            total_reviews: d?.total_reviews ?? 0,
          };
        })
        .filter(Boolean) as SavedHelper[];

      setHelpers(merged);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleRemove = async (helperUserId: string) => {
    if (!user) return;
    await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("helper_user_id", helperUserId);
    setHelpers((prev) => prev.filter((h) => h.user_id !== helperUserId));
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Saved Helpers | Look For Helper"
        description="Helpers you've bookmarked for later on Look For Helper."
        path="/saved-helpers"
        noindex
      />
      <Navbar />
      <div className="container py-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Saved Helpers</h1>
        <p className="text-muted-foreground mb-6">Helpers you've saved for later.</p>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading...</div>
        ) : helpers.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Heart className="mx-auto h-10 w-10 mb-3 text-muted-foreground/40" />
            <p>You haven't saved any helpers yet.</p>
            <Button asChild className="mt-4"><Link to="/browse">Browse Helpers</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {helpers.map((h) => (
              <Card key={h.user_id} className="overflow-hidden">
                <Link to={`/helper/${h.user_id}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {h.avatar_url ? (
                      <img src={h.avatar_url} alt={h.full_name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground/30">
                        {h.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Link to={`/helper/${h.user_id}`}>
                      <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-1.5">
                        {h.full_name}
                        {h.is_verified && <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />}
                      </h3>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(h.user_id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    {h.average_rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {h.average_rating.toFixed(1)}
                      </span>
                    )}
                    {h.city && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {h.city}</span>}
                    {h.years_experience != null && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {h.years_experience} yrs</span>}
                  </div>
                  {h.skills && h.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {h.skills.slice(0, 3).map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedHelpers;
