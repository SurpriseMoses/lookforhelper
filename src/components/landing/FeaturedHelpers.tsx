import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Star, ShieldCheck, Zap, Globe, Building2, Map } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeaturedHelper {
  user_id: string;
  skills: string[];
  years_experience: number;
  city: string;
  country: string;
  average_rating: number;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_boosted: boolean;
  availability_status: string;
}

type FilterMode = "country" | "city" | "global";

const FeaturedHelpers = () => {
  const [allHelpers, setAllHelpers] = useState<FeaturedHelper[]>([]);
  const [filtered, setFiltered] = useState<FeaturedHelper[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>("country");
  const [detectedCountry, setDetectedCountry] = useState<string>("South Africa");
  const [detectedCity, setDetectedCity] = useState<string>("");

  // Detect user location from IP-based geolocation or browser
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Try browser geolocation to find nearest city
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude } = pos.coords;
              const { data } = await supabase.from("cities").select("city_name, province, country");
              if (data && data.length > 0) {
                // Find nearest city (rough Euclidean)
                let nearest = data[0];
                let minDist = Infinity;
                // We need lat/lng from cities - refetch with coords
                const { data: citiesWithCoords } = await supabase
                  .from("cities")
                  .select("city_name, province, country, latitude, longitude");
                if (citiesWithCoords) {
                  for (const city of citiesWithCoords) {
                    if (city.latitude == null || city.longitude == null) continue;
                    const dist = Math.sqrt(
                      Math.pow(city.latitude - latitude, 2) +
                      Math.pow(city.longitude - longitude, 2)
                    );
                    if (dist < minDist) {
                      minDist = dist;
                      nearest = city;
                    }
                  }
                }
                setDetectedCountry(nearest.country || "South Africa");
                setDetectedCity(nearest.city_name || "");
              }
            },
            () => {
              // Geolocation denied - keep defaults
            },
            { timeout: 5000 }
          );
        }
      } catch {
        // Keep defaults
      }
    };
    detectLocation();
  }, []);

  const fetchFeatured = useCallback(async () => {
    try {
      const now = new Date().toISOString();

      const { data: boostedData } = await supabase
        .from("helper_details")
        .select("user_id, skills, years_experience, city, country, average_rating, is_featured, featured_until, availability_status")
        .eq("is_published", true)
        .eq("is_featured", true)
        .gte("featured_until", now)
        .order("average_rating", { ascending: false })
        .limit(20);

      const boostedUserIds = new Set((boostedData || []).map((h) => h.user_id));

      const { data: listingData } = await supabase
        .from("helper_subscriptions")
        .select("user_id, featured_active, featured_expires_at, status")
        .eq("featured_active", true);

      const activeListingUserIds = (listingData || [])
        .filter((s) => {
          const hasPaidListing = s.status === "active" && s.featured_expires_at && new Date(s.featured_expires_at) > new Date();
          return hasPaidListing && !boostedUserIds.has(s.user_id);
        })
        .map((s) => s.user_id);

      let listingHelpers: typeof boostedData = [];
      if (activeListingUserIds.length > 0) {
        const { data } = await supabase
          .from("helper_details")
          .select("user_id, skills, years_experience, city, country, average_rating, is_featured, featured_until, availability_status")
          .eq("is_published", true)
          .in("user_id", activeListingUserIds)
          .order("average_rating", { ascending: false })
          .limit(20);
        listingHelpers = data || [];
      }

      const allRaw = [...(boostedData || []), ...(listingHelpers || [])];

      if (allRaw.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = allRaw.map((h) => h.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, is_verified")
        .in("user_id", userIds);

      const profileMap = new Map<string, { user_id: string; full_name: string; avatar_url: string | null; is_verified: boolean }>();
      (profiles || []).forEach((p) => profileMap.set(p.user_id, p));

      const merged: FeaturedHelper[] = allRaw.map((h) => {
        const profile = profileMap.get(h.user_id);
        const isBoosted = boostedUserIds.has(h.user_id);
        return {
          user_id: h.user_id,
          skills: h.skills || [],
          years_experience: h.years_experience || 0,
          city: h.city || "",
          country: h.country || "South Africa",
          average_rating: h.average_rating || 0,
          full_name: profile?.full_name || "Helper",
          avatar_url: profile?.avatar_url || null,
          is_verified: profile?.is_verified || false,
          is_boosted: isBoosted,
          availability_status: h.availability_status || "not_available",
        };
      });

      setAllHelpers(merged);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  // Apply filter whenever mode, detected location, or helpers change
  useEffect(() => {
    if (allHelpers.length === 0) {
      setFiltered([]);
      return;
    }

    let result: FeaturedHelper[];
    switch (filterMode) {
      case "city":
        result = detectedCity
          ? allHelpers.filter((h) => h.city.toLowerCase() === detectedCity.toLowerCase())
          : allHelpers;
        break;
      case "country":
        result = allHelpers.filter((h) => h.country.toLowerCase() === detectedCountry.toLowerCase());
        break;
      case "global":
      default:
        result = allHelpers;
        break;
    }

    setFiltered(result.slice(0, 10));
  }, [filterMode, allHelpers, detectedCountry, detectedCity]);

  if (loading || allHelpers.length === 0) return null;

  const getFilterIcon = () => {
    if (filterMode === "global") return <Globe className="h-4 w-4 text-muted-foreground" />;
    if (filterMode === "city") return <Building2 className="h-4 w-4 text-muted-foreground" />;
    return <Map className="h-4 w-4 text-muted-foreground" />;
  };

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

        {/* Filter dropdown */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {getFilterIcon()}
          <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="country">
                <span className="flex items-center gap-2">
                  <Map className="h-3.5 w-3.5" />
                  {detectedCountry}
                </span>
              </SelectItem>
              {detectedCity && (
                <SelectItem value="city">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    {detectedCity}
                  </span>
                </SelectItem>
              )}
              <SelectItem value="global">
                <span className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  Global
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-14 text-center py-12">
            <Globe className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              No featured helpers found in this area yet.
            </p>
            <button
              onClick={() => setFilterMode("global")}
              className="mt-2 text-sm text-primary hover:underline"
            >
              View all helpers globally
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((helper, i) => (
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
        )}
      </div>
    </section>
  );
};

export default FeaturedHelpers;
