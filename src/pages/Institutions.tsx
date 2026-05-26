import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import InstitutionCard from "@/components/institutions/InstitutionCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { INSTITUTION_COURSE_CATEGORIES } from "@/lib/institutionCategories";
import { GraduationCap, Search } from "lucide-react";

interface Inst {
  id: string;
  institution_name: string;
  description: string | null;
  country: string;
  city: string | null;
  logo_url: string | null;
  banner_url: string | null;
  verification_status: string;
}
interface Course { institution_id: string; course_name: string; fee: number | null; currency: string; category: string }

const PAGE_SIZE = 12;

const Institutions = () => {
  const [institutions, setInstitutions] = useState<Inst[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("countries").select("country_name").eq("is_active", true).order("country_name").then(({ data }) => {
      if (data) setCountries(data.map((c) => c.country_name));
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    (async () => {
      let q = supabase.from("institutions").select("*").eq("is_suspended", false).order("created_at", { ascending: false });
      if (verifiedOnly) q = q.eq("verification_status", "verified");
      const { data: insts } = await q;
      const list = insts || [];
      setInstitutions(list);

      if (list.length) {
        const { data: cs } = await supabase
          .from("institution_courses")
          .select("institution_id, course_name, fee, currency, category")
          .in("institution_id", list.map((i) => i.id));
        setCourses(cs || []);
      } else {
        setCourses([]);
      }
      setLoading(false);
    })();
  }, [verifiedOnly]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return institutions.filter((i) => {
      if (country !== "all" && i.country !== country) return false;
      if (city.trim() && !(i.city || "").toLowerCase().includes(city.trim().toLowerCase())) return false;
      if (term && !i.institution_name.toLowerCase().includes(term) && !(i.description || "").toLowerCase().includes(term)) return false;
      if (category !== "all") {
        const has = courses.some((c) => c.institution_id === i.id && c.category === category);
        if (!has) return false;
      }
      return true;
    });
  }, [institutions, courses, search, country, city, category]);

  const paged = filtered.slice(0, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Domestic Worker Training Institutions | Look For Helper"
        description="Discover verified domestic worker training institutions. Compare courses, fees and certifications across Africa."
        path="/institutions"
      />
      <Navbar />
      <div className="container py-6 md:py-10">
        <div className="mb-6 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl md:text-3xl font-bold">Training Institutions</h1>
        </div>
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          A trusted directory of domestic worker training institutions — childcare, elderly care, housekeeping and more.
        </p>

        {/* Filters */}
        <div className="mb-6 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search institutions..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Course category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {INSTITUTION_COURSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 md:col-span-3">
            <Checkbox id="verified-only" checked={verifiedOnly} onCheckedChange={(v) => setVerifiedOnly(!!v)} />
            <Label htmlFor="verified-only" className="cursor-pointer text-sm">Verified institutions only</Label>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border bg-card py-20 text-center">
            <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No institutions found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paged.map((i) => (
                <InstitutionCard
                  key={i.id}
                  institution={i}
                  courses={courses.filter((c) => c.institution_id === i.id)}
                />
              ))}
            </div>
            {paged.length < filtered.length && (
              <div className="mt-8 text-center">
                <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Load more</Button>
              </div>
            )}
          </>
        )}

        <div className="mt-12 rounded-lg border bg-gradient-to-br from-primary/5 to-accent/10 p-6 text-center">
          <h3 className="font-display text-xl font-bold">Are you a training institution?</h3>
          <p className="mt-2 text-sm text-muted-foreground">Reach helpers across Africa and grow your enrolments.</p>
          <Button asChild className="mt-4">
            <a href="/auth/institution">Register your institution</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Institutions;
