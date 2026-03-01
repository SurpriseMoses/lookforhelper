import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Search, CheckCircle, Star, Circle } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface HelperWithProfile {
  user_id: string;
  age: number | null;
  gender: string | null;
  city: string | null;
  country: string | null;
  years_experience: number | null;
  skills: string[] | null;
  languages: string[] | null;
  about_me: string | null;
  is_verified: boolean;
  is_featured: boolean;
  featured_until: string | null;
  average_rating: number;
  total_reviews: number;
  availability_status: string;
  available_from: string | null;
  work_type: string[] | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

const SKILL_OPTIONS = ["Nanny", "Babysitter", "Cleaner", "Caregiver", "Cook", "Driver", "Gardener"];

const Browse = () => {
  const [helpers, setHelpers] = useState<HelperWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [skillFilter, setSkillFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [workTypeFilter, setWorkTypeFilter] = useState("all");

  const handleHelperClick = (e: React.MouseEvent, userId: string) => {
    if (!user) {
      e.preventDefault();
      navigate("/auth");
    }
  };

  const fetchHelpers = async () => {
    setHasSearched(true);
    setLoading(true);
    let query = supabase
      .from("helper_details")
      .select("user_id, age, gender, city, country, years_experience, skills, languages, about_me, is_featured, featured_until, average_rating, total_reviews, availability_status, available_from, work_type")
      .eq("is_published", true);

    if (skillFilter !== "all") {
      query = query.contains("skills", [skillFilter]);
    }
    if (genderFilter !== "all") {
      query = query.eq("gender", genderFilter);
    }
    if (cityFilter) {
      query = query.ilike("city", `%${cityFilter}%`);
    }
    if (availabilityFilter === "available_now") {
      query = query.eq("availability_status", "available_now");
    } else if (availabilityFilter === "within_30_days") {
      query = query.in("availability_status", ["available_now", "available_soon"]);
    }
    if (workTypeFilter !== "all") {
      query = query.contains("work_type", [workTypeFilter]);
    }

    if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("years_experience", { ascending: false });
    }

    const { data } = await query;
    const helperRows = data ?? [];

    // Filter by active subscription (trial or active)
    if (helperRows.length > 0) {
      const userIds = helperRows.map((h: any) => h.user_id);

      // Fetch subscriptions to filter eligible helpers
      const { data: subsData } = await supabase
        .from("helper_subscriptions")
        .select("user_id")
        .in("user_id", userIds)
        .in("status", ["trial", "active"]);

      const eligibleIds = new Set((subsData ?? []).map((s: any) => s.user_id));
      const eligibleHelpers = helperRows.filter((h: any) => eligibleIds.has(h.user_id));

      if (eligibleHelpers.length === 0) {
        setHelpers([]);
        setLoading(false);
        return;
      }

      const eligibleUserIds = eligibleHelpers.map((h: any) => h.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, is_verified")
        .in("user_id", eligibleUserIds);

      const profileMap = new Map(
        (profilesData ?? []).map((p: any) => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url, is_verified: p.is_verified }])
      );

      const now = new Date();
      const results = eligibleHelpers.map((h: any) => {
        const isFeaturedActive = h.is_featured && h.featured_until && new Date(h.featured_until) > now;
        return {
          ...h,
          is_verified: profileMap.get(h.user_id)?.is_verified ?? false,
          is_featured: isFeaturedActive,
          average_rating: Number(h.average_rating) || 0,
          total_reviews: h.total_reviews || 0,
          availability_status: h.availability_status ?? "not_available",
          available_from: h.available_from ?? null,
          work_type: h.work_type ?? [],
          profiles: profileMap.get(h.user_id) ? { full_name: profileMap.get(h.user_id)!.full_name, avatar_url: profileMap.get(h.user_id)!.avatar_url } : null,
        };
      }) as HelperWithProfile[];

      // Sort: featured first, then verified, then newest
      results.sort((a, b) => {
        const aFeatured = a.is_featured ? 1 : 0;
        const bFeatured = b.is_featured ? 1 : 0;
        if (bFeatured !== aFeatured) return bFeatured - aFeatured;
        const aVerified = a.is_verified ? 1 : 0;
        const bVerified = b.is_verified ? 1 : 0;
        if (bVerified !== aVerified) return bVerified - aVerified;
        // Available now rank higher
        const aAvail = a.availability_status === "available_now" ? 1 : 0;
        const bAvail = b.availability_status === "available_now" ? 1 : 0;
        if (bAvail !== aAvail) return bAvail - aAvail;
        // Then by average rating
        if (b.average_rating !== a.average_rating) return b.average_rating - a.average_rating;
        return 0;
      });

      setHelpers(results);

      // Track search appearances for all displayed helpers
      if (results.length > 0) {
        const ids = results.map((r) => r.user_id);
        supabase.rpc("track_search_appearances", { helper_user_ids: ids }).then(() => {});
      }
    } else {
      setHelpers([]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Browse Helpers</h1>
          <p className="mt-2 text-muted-foreground">
            Find the perfect helper for your household needs.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4 rounded-xl border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Search by city</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="e.g. Johannesburg"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") fetchHelpers(); }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Skill</Label>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger><SelectValue placeholder="All skills" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All skills</SelectItem>
                  {SKILL_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Gender</Label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Availability</Label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="available_now">Available Now</SelectItem>
                  <SelectItem value="within_30_days">Available within 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Work Type</Label>
              <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="live_in">Live-in</SelectItem>
                  <SelectItem value="live_out">Live-out</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sort by</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="experience">Most experienced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={fetchHelpers} className="w-full sm:w-auto gap-2">
            <Search className="h-4 w-4" /> Search Helpers
          </Button>
        </div>

        {/* Results */}
        {!hasSearched ? (
          <div className="py-20 text-center text-muted-foreground">
            Use the filters above and click "Search Helpers" to find helpers.
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading helpers...</div>
        ) : helpers.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No helpers found matching your criteria. Try adjusting your filters.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {helpers.map((helper) => (
              <Link key={helper.user_id} to={`/helper/${helper.user_id}`} onClick={(e) => handleHelperClick(e, helper.user_id)}>
                <Card className={`overflow-hidden transition-shadow hover:shadow-lg cursor-pointer ${helper.is_featured ? "ring-2 ring-amber-400/50" : ""}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {helper.is_featured && (
                      <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    )}
                    {helper.profiles?.avatar_url ? (
                      <img
                        src={helper.profiles.avatar_url}
                        alt={helper.profiles.full_name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground/30">
                        {helper.profiles?.full_name?.charAt(0) ?? "?"}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                      {helper.profiles?.full_name ?? "Helper"}
                      {helper.is_verified && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </h3>
                    {helper.availability_status === "available_now" && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                        <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" /> Available Now
                      </span>
                    )}
                    {helper.availability_status === "available_soon" && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-700">
                        <Circle className="h-2 w-2 fill-amber-500 text-amber-500" /> Available soon
                      </span>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      {helper.total_reviews > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {helper.average_rating.toFixed(1)}
                          <span className="text-xs">({helper.total_reviews})</span>
                        </span>
                      )}
                      {helper.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {helper.city}
                        </span>
                      )}
                      {helper.years_experience != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {helper.years_experience} yrs
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {helper.skills?.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
