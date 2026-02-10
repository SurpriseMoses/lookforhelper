import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Search } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import { Link } from "react-router-dom";

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
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

const SKILL_OPTIONS = ["Nanny", "Babysitter", "Cleaner", "Caregiver", "Cook", "Driver", "Gardener"];

const Browse = () => {
  const [helpers, setHelpers] = useState<HelperWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const [skillFilter, setSkillFilter] = useState(searchParams.get("skill") ?? "all");
  const [genderFilter, setGenderFilter] = useState(searchParams.get("gender") ?? "all");
  const [cityFilter, setCityFilter] = useState(searchParams.get("city") ?? "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") ?? "newest");

  useEffect(() => {
    fetchHelpers();
  }, [skillFilter, genderFilter, cityFilter, sortBy]);

  const fetchHelpers = async () => {
    setLoading(true);
    let query = supabase
      .from("helper_details")
      .select("user_id, age, gender, city, country, years_experience, skills, languages, about_me, profiles(full_name, avatar_url)")
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

    if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("years_experience", { ascending: false });
    }

    const { data } = await query;
    setHelpers((data as unknown as HelperWithProfile[]) ?? []);
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
        <div className="mb-8 grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Search by city</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="e.g. Johannesburg"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
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

        {/* Results */}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading helpers...</div>
        ) : helpers.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No helpers found matching your criteria. Try adjusting your filters.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {helpers.map((helper) => (
              <Link key={helper.user_id} to={`/helper/${helper.user_id}`}>
                <Card className="overflow-hidden transition-shadow hover:shadow-lg cursor-pointer">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
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
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {helper.profiles?.full_name ?? "Helper"}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
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
