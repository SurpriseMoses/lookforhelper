import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Globe, ArrowLeft, MessageSquare } from "lucide-react";
import Navbar from "@/components/landing/Navbar";

interface HelperProfile {
  user_id: string;
  age: number | null;
  gender: string | null;
  city: string | null;
  country: string | null;
  willing_to_work_abroad: boolean | null;
  years_experience: number | null;
  skills: string[] | null;
  languages: string[] | null;
  salary_expectation: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_negotiable: boolean | null;
  about_me: string | null;
  video_introduction_url: string | null;
  helper_references: { name: string; relationship: string }[] | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

const HelperProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [helper, setHelper] = useState<HelperProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchHelper = async () => {
      const { data: helperData } = await supabase
        .from("helper_details")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!helperData) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

      setHelper({
        ...helperData,
        helper_references: helperData.helper_references as any,
        profiles: profileData ?? null,
      } as HelperProfile);
      setLoading(false);
    };

    fetchHelper();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!helper) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Helper profile not found.</p>
          <Button asChild className="mt-4">
            <Link to="/browse">Back to Browse</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/browse">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Browse
          </Link>
        </Button>

        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              {/* Avatar */}
              <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-muted">
                {helper.profiles?.avatar_url ? (
                  <img
                    src={helper.profiles.avatar_url}
                    alt={helper.profiles.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground/30">
                    {helper.profiles?.full_name?.charAt(0) ?? "?"}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {helper.profiles?.full_name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:justify-start">
                  {helper.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {helper.city}, {helper.country}
                    </span>
                  )}
                  {helper.years_experience != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {helper.years_experience} years experience
                    </span>
                  )}
                  {helper.willing_to_work_abroad && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-4 w-4" /> Willing to work abroad
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {helper.skills?.map((skill) => (
                    <Badge key={skill} className="bg-accent/15 text-accent-foreground">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="mt-8 space-y-6">
              {helper.about_me && (
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground">About Me</h2>
                  <p className="mt-2 whitespace-pre-line text-muted-foreground">{helper.about_me}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {helper.age && (
                  <div>
                    <span className="text-sm font-medium text-foreground">Age</span>
                    <p className="text-muted-foreground">{helper.age} years old</p>
                  </div>
                )}
                {helper.gender && (
                  <div>
                    <span className="text-sm font-medium text-foreground">Gender</span>
                    <p className="text-muted-foreground">{helper.gender}</p>
                  </div>
                )}
                {helper.languages && helper.languages.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-foreground">Languages</span>
                    <p className="text-muted-foreground">{helper.languages.join(", ")}</p>
                  </div>
                )}
                {(helper.salary_min || helper.salary_max) && (
                  <div>
                    <span className="text-sm font-medium text-foreground">Salary Range</span>
                    <p className="text-muted-foreground">
                      {helper.salary_min ? `R${helper.salary_min.toLocaleString()}` : "—"}
                      {" – "}
                      {helper.salary_max ? `R${helper.salary_max.toLocaleString()}` : "—"}
                      /month
                      {helper.salary_negotiable && " (Negotiable)"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Introduction */}
            {helper.video_introduction_url && (
              <div className="mt-6">
                <h2 className="font-display text-lg font-semibold text-foreground">Video Introduction</h2>
                <video
                  src={helper.video_introduction_url}
                  controls
                  className="mt-2 w-full max-w-lg rounded-lg"
                />
              </div>
            )}

            {/* References */}
            {helper.helper_references && helper.helper_references.length > 0 && (
              <div className="mt-6">
                <h2 className="font-display text-lg font-semibold text-foreground">References</h2>
                <div className="mt-2 space-y-2">
                  {helper.helper_references.map((ref, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <p className="text-sm font-medium text-foreground">{ref.name}</p>
                      <p className="text-xs text-muted-foreground">{ref.relationship}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact CTA */}
            <div className="mt-8 rounded-xl border bg-muted/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Messaging is coming in v2. For now, browse and bookmark helpers.
              </p>
              <Button disabled className="mt-3 gap-2">
                <MessageSquare className="h-4 w-4" /> Contact Helper
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelperProfilePage;
