import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Globe, ArrowLeft, Flag, CheckCircle, Star, MessageSquarePlus, Search, Briefcase, Circle, ShieldCheck } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import ContactHelperButton from "@/components/messaging/ContactHelperButton";
import ReportUserDialog from "@/components/moderation/ReportUserDialog";
import ReviewHelperDialog from "@/components/reviews/ReviewHelperDialog";
import HelperReviewsList from "@/components/reviews/HelperReviewsList";
import { useAuth } from "@/contexts/AuthContext";
import ActivityIndicator from "@/components/profile/ActivityIndicator";
import ResponseTimeBadge from "@/components/profile/ResponseTimeBadge";
import TopHelperBadge from "@/components/profile/TopHelperBadge";
import SafetyTipsBox from "@/components/profile/SafetyTipsBox";
import WhatsAppShareButton from "@/components/profile/WhatsAppShareButton";

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
  is_featured: boolean;
  featured_until: string | null;
  background_check_status: string;
  availability_status: string;
  available_from: string | null;
  work_type: string[] | null;
  preferred_hours: string | null;
  average_rating: number;
  total_reviews: number;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    is_verified?: boolean;
    last_active_at?: string | null;
  } | null;
  response_time?: { avg_response_minutes: number; response_count: number } | null;
}

const HelperProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [helper, setHelper] = useState<HelperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  const [hireCount, setHireCount] = useState(0);

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
        .select("full_name, avatar_url, is_verified, last_active_at")
        .eq("user_id", userId)
        .maybeSingle();

      // Fetch response metrics
      const { data: responseData } = await supabase
        .from("response_metrics")
        .select("avg_response_minutes, response_count")
        .eq("user_id", userId)
        .maybeSingle();

      // Track profile view
      await supabase.rpc("track_profile_view", { helper_user_id: userId });

      const now = new Date();
      const isFeaturedActive = (helperData as any).is_featured && (helperData as any).featured_until && new Date((helperData as any).featured_until) > now;

      setHelper({
        ...helperData,
        is_featured: isFeaturedActive,
        featured_until: (helperData as any).featured_until,
        average_rating: (helperData as any).average_rating ?? 0,
        total_reviews: (helperData as any).total_reviews ?? 0,
        background_check_status: (helperData as any).background_check_status ?? "not_available",
        availability_status: (helperData as any).availability_status ?? "not_available",
        available_from: (helperData as any).available_from ?? null,
        work_type: (helperData as any).work_type ?? [],
        preferred_hours: (helperData as any).preferred_hours ?? null,
        helper_references: helperData.helper_references as any,
        profiles: profileData ?? null,
        response_time: responseData ?? null,
      } as HelperProfile);

      // Fetch confirmed hire count
      const { count } = await supabase
        .from("hires")
        .select("id", { count: "exact", head: true })
        .eq("helper_id", userId)
        .eq("status", "confirmed");
      setHireCount(count ?? 0);

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
                <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2 justify-center md:justify-start">
                  {helper.profiles?.full_name}
                  {helper.profiles?.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      <CheckCircle className="h-3.5 w-3.5" /> Verified Identity
                    </span>
                  )}
                  {helper.is_featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      <Star className="h-3.5 w-3.5" /> Featured Helper
                    </span>
                  )}
                  <TopHelperBadge
                    averageRating={Number(helper.average_rating)}
                    completedHires={hireCount}
                    isVerified={!!helper.profiles?.is_verified}
                  />
                </h1>
                {/* Activity & Response badges */}
                <div className="mt-1 flex flex-wrap gap-1.5 justify-center md:justify-start">
                  <ActivityIndicator lastActiveAt={helper.profiles?.last_active_at ?? null} />
                  <ResponseTimeBadge
                    avgResponseMinutes={helper.response_time?.avg_response_minutes ?? null}
                    responseCount={helper.response_time?.response_count ?? 0}
                  />
                </div>
                {/* Background Check Badge */}
                {helper.background_check_status === "approved" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    <Search className="h-3.5 w-3.5" /> Background Checked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    <Search className="h-3.5 w-3.5" /> Background Check — Coming Soon
                  </span>
                )}
                {/* Rating display */}
                {helper.total_reviews > 0 && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-foreground">
                      {Number(helper.average_rating).toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({helper.total_reviews} {helper.total_reviews === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
                {hireCount > 0 && (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      <Briefcase className="h-3.5 w-3.5" /> Hired {hireCount} {hireCount === 1 ? "time" : "times"}
                    </span>
                  </div>
                )}
                {/* Availability Status */}
                <div className="mt-2">
                  {helper.availability_status === "available_now" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" /> Available Now
                    </span>
                  )}
                  {helper.availability_status === "available_soon" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      <Circle className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Available from {helper.available_from ? new Date(helper.available_from).toLocaleDateString() : "soon"}
                    </span>
                  )}
                  {helper.availability_status === "not_available" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      <Circle className="h-2.5 w-2.5 fill-red-400 text-red-400" /> Not currently available
                    </span>
                  )}
                </div>
                {/* Work type & preferred hours */}
                {helper.work_type && helper.work_type.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {helper.work_type.map((wt) => (
                      <Badge key={wt} variant="secondary" className="text-xs capitalize">
                        {wt.replace("_", "-")}
                      </Badge>
                    ))}
                  </div>
                )}
                {helper.preferred_hours && (
                  <p className="mt-1 text-xs text-muted-foreground">Schedule: {helper.preferred_hours}</p>
                )}
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

            {/* Reviews */}
            <HelperReviewsList helperUserId={helper.user_id} refreshKey={reviewRefreshKey} />

            {/* Safety Tips */}
            <SafetyTipsBox />

            {/* Contact, Review, Share & Report */}
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <ContactHelperButton helperUserId={helper.user_id} />
              <WhatsAppShareButton
                fullName={helper.profiles?.full_name ?? "Helper"}
                primarySkill={helper.skills?.[0]}
                city={helper.city ?? undefined}
                rating={Number(helper.average_rating)}
                userId={helper.user_id}
              />
              {user && user.id !== helper.user_id && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReview(true)}
                    className="gap-1"
                  >
                    <MessageSquarePlus className="h-4 w-4" /> Leave Review
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowReport(true)} className="gap-1 text-muted-foreground">
                    <Flag className="h-4 w-4" /> Report
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showReport && userId && (
        <ReportUserDialog
          open={showReport}
          onClose={() => setShowReport(false)}
          reportedUserId={userId}
          contextType="profile"
        />
      )}

      {showReview && userId && (
        <ReviewHelperDialog
          open={showReview}
          onClose={() => setShowReview(false)}
          helperUserId={userId}
          helperName={helper?.profiles?.full_name ?? "Helper"}
          onReviewSubmitted={() => setReviewRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
};

export default HelperProfilePage;
