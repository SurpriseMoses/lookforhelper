import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Star, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface FeaturedHelper {
  user_id: string;
  skills: string[];
  years_experience: number;
  city: string;
  average_rating: number;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_boosted: boolean;
  availability_status: string;
}

const FeaturedHelpers = () => {
  const [helpers, setHelpers] = useState<FeaturedHelper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const now = new Date().toISOString();

        // Fetch boosted helpers (active boost with valid featured_until)
        const { data: boostedData } = await supabase
          .from("helper_details")
          .select("user_id, skills, years_experience, city, average_rating, is_featured, featured_until, availability_status")
          .eq("is_published", true)
          .eq("is_featured", true)
          .gte("featured_until", now)
          .order("average_rating", { ascending: false })
          .limit(10);

        const boostedUserIds = new Set((boostedData || []).map((h) => h.user_id));

        // Fetch verified helpers (not already boosted)
        const { data: verifiedProfiles } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("is_verified", true);

        const verifiedUserIds = new Set((verifiedProfiles || []).map((p) => p.user_id));
        const verifiedOnlyIds = [...verifiedUserIds].filter((id) => !boostedUserIds.has(id));

        let verifiedHelpers: typeof boostedData = [];
        if (verifiedOnlyIds.length > 0) {
          const { data } = await supabase
            .from("helper_details")
            .select("user_id, skills, years_experience, city, average_rating, is_featured, featured_until, availability_status")
            .eq("is_published", true)
            .in("user_id", verifiedOnlyIds)
            .order("average_rating", { ascending: false })
            .limit(10);
          verifiedHelpers = data || [];
        }

        // Fetch listing-active helpers (active subscription, not already boosted or verified-listed)
        const { data: listingData } = await supabase
          .from("helper_subscriptions")
          .select("user_id, featured_active, featured_expires_at")
          .eq("featured_active", true);

        const activeListingUserIds = (listingData || [])
          .filter((s) => s.featured_expires_at && new Date(s.featured_expires_at) > new Date())
          .map((s) => s.user_id);

        const alreadyIncluded = new Set([...boostedUserIds, ...verifiedOnlyIds.filter((id) => (verifiedHelpers || []).some((h) => h.user_id === id))]);
        const listingOnlyIds = activeListingUserIds.filter((id) => !alreadyIncluded.has(id));

        let listingHelpers: typeof boostedData = [];
        if (listingOnlyIds.length > 0) {
          const { data } = await supabase
            .from("helper_details")
            .select("user_id, skills, years_experience, city, average_rating, is_featured, featured_until, availability_status")
            .eq("is_published", true)
            .in("user_id", listingOnlyIds)
            .order("average_rating", { ascending: false })
            .limit(10);
          listingHelpers = data || [];
        }

        // Combine: boosted first, then verified, then listing subscribers
        const allHelpers = [...(boostedData || []), ...verifiedHelpers, ...listingHelpers].slice(0, 10);

        if (allHelpers.length === 0) {
          setLoading(false);
          return;
        }

        const userIds = allHelpers.map((h) => h.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, is_verified")
          .in("user_id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.user_id, p])
        );

        const merged: FeaturedHelper[] = allHelpers.map((h) => {
          const profile = profileMap.get(h.user_id);
          const isBoosted = boostedUserIds.has(h.user_id);
          return {
            user_id: h.user_id,
            skills: h.skills || [],
            years_experience: h.years_experience || 0,
            city: h.city || "",
            average_rating: h.average_rating || 0,
            full_name: profile?.full_name || "Helper",
            avatar_url: profile?.avatar_url || null,
            is_verified: profile?.is_verified || false,
            is_boosted: isBoosted,
            availability_status: h.availability_status || "not_available",
          };
        });

        setHelpers(merged);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  if (loading || helpers.length === 0) return null;

  return (
    <section className="bg-secondary/50 py-20 md:py-28">
      <div className="container">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Featured Helpers
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Helpers who chose to increase their visibility and get hired faster.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {helpers.map((helper, i) => (
            <motion.div
              key={helper.user_id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link to={`/helper/${helper.user_id}`}>
                <Card className={`overflow-hidden transition-shadow hover:shadow-lg ${helper.is_boosted ? "ring-2 ring-primary/50" : ""}`}>
                  <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center relative">
                    {helper.avatar_url ? (
                      <img
                        src={helper.avatar_url}
                        alt={helper.full_name}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-muted-foreground">
                        {helper.full_name.charAt(0)}
                      </div>
                    )}
                    {helper.is_boosted && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-primary text-primary-foreground text-xs gap-1">
                          <Zap className="h-3 w-3" /> Boosted
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {helper.full_name}
                      </h3>
                      {helper.average_rating > 0 && (
                        <span className="flex items-center gap-1 text-sm text-primary">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {helper.average_rating}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      {helper.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {helper.city}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {helper.years_experience} yrs exp
                      </span>
                      {helper.is_verified && (
                        <span className="flex items-center gap-1 text-primary">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                      {helper.availability_status === "available_now" && (
                        <Badge variant="secondary" className="text-xs">
                          Available Now
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {helper.skills.slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs font-medium"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedHelpers;
