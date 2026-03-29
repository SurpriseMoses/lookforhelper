import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import JobCard from "@/components/jobs/JobCard";
import PostJobDialog from "@/components/jobs/PostJobDialog";
import { Briefcase } from "lucide-react";

interface JobRow {
  id: string;
  seeker_id: string;
  title: string;
  description: string | null;
  skills: string[];
  location_preference: string;
  city: string | null;
  country: string | null;
  province: string | null;
  created_at: string;
  status: string;
}

const Jobs = () => {
  const { user, role } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);

    // Fetch open jobs
    const { data: jobsData, error } = await supabase
      .from("jobs" as any)
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error || !jobsData) {
      setLoading(false);
      return;
    }

    const typedJobs = jobsData as unknown as JobRow[];

    // Get seeker profiles
    const seekerIds = [...new Set(typedJobs.map((j) => j.seeker_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", seekerIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    // Get user's responses if helper
    let myResponses = new Set<string>();
    if (user && role === "helper") {
      const { data: responses } = await supabase
        .from("job_responses" as any)
        .select("job_id")
        .eq("helper_id", user.id);
      if (responses) {
        myResponses = new Set((responses as any[]).map((r: any) => r.job_id));
      }
    }

    // Get response counts for own jobs
    let responseCounts = new Map<string, number>();
    if (user) {
      const ownJobIds = typedJobs.filter((j) => j.seeker_id === user.id).map((j) => j.id);
      if (ownJobIds.length > 0) {
        const { data: counts } = await supabase
          .from("job_responses" as any)
          .select("job_id")
          .in("job_id", ownJobIds);
        if (counts) {
          (counts as any[]).forEach((r: any) => {
            responseCounts.set(r.job_id, (responseCounts.get(r.job_id) || 0) + 1);
          });
        }
      }
    }

    const enriched = typedJobs.map((j) => {
      const p = profileMap.get(j.seeker_id);
      return {
        ...j,
        seeker_name: p?.full_name || "Seeker",
        seeker_avatar: p?.avatar_url || null,
        hasResponded: myResponses.has(j.id),
        responseCount: responseCounts.get(j.id) || 0,
      };
    });

    setJobs(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const isSeeker = role === "seeker" || role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-6 w-6" /> Jobs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Domestic job postings from verified seekers
            </p>
          </div>
          {isSeeker && <PostJobDialog onJobPosted={fetchJobs} />}
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No jobs posted yet.</p>
            {isSeeker && <p className="text-sm mt-1">Be the first to post a job!</p>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                hasResponded={job.hasResponded}
                responseCount={job.responseCount}
                onResponseChange={fetchJobs}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
