import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import InstitutionCard from "@/components/institutions/InstitutionCard";
import { Heart } from "lucide-react";

const SavedInstitutions = () => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: saved } = await supabase.from("saved_institutions").select("institution_id").eq("helper_id", user.id);
      const ids = (saved || []).map((s) => s.institution_id);
      if (ids.length === 0) { setItems([]); setLoading(false); return; }
      const { data: insts } = await supabase.from("institutions").select("*").in("id", ids);
      const { data: cs } = await supabase.from("institution_courses").select("institution_id, course_name, fee, currency, category").in("institution_id", ids);
      setItems(insts || []);
      setCourses(cs || []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Saved Institutions | Look For Helper" description="Institutions you've bookmarked on Look For Helper." path="/saved-institutions" noindex />
      <Navbar />
      <div className="container py-8">
        <div className="mb-6 flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Saved Institutions</h1>
        </div>
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border bg-card py-16 text-center text-muted-foreground">
            No saved institutions yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => <InstitutionCard key={i.id} institution={i} courses={courses.filter((c) => c.institution_id === i.id)} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedInstitutions;
