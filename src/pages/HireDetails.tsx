import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSeekerSubscription } from "@/contexts/SeekerSubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import ReviewHelperDialog from "@/components/reviews/ReviewHelperDialog";
import SeekerPaywallDialog from "@/components/subscription/SeekerPaywallDialog";
import DisputeDialog from "@/components/disputes/DisputeDialog";
import {
  ArrowLeft,
  Briefcase,
  MessageSquare,
  XCircle,
  RefreshCw,
  Star,
  Clock,
  CheckCircle2,
  BadgeCheck,
  Shield,
  Calendar,
  MapPin,
  Languages,
  Search,
} from "lucide-react";
import { format } from "date-fns";

const HireDetails = () => {
  const { hireId } = useParams<{ hireId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasActiveSubscription } = useSeekerSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [hire, setHire] = useState<any>(null);
  const [helper, setHelper] = useState<any>(null);
  const [helperProfile, setHelperProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user]);

  useEffect(() => {
    if (!user || !hireId) return;
    loadData();
  }, [user, hireId]);

  const loadData = async () => {
    const { data: h } = await supabase
      .from("hires")
      .select("*")
      .eq("id", hireId!)
      .maybeSingle();

    if (!h) {
      navigate("/dashboard");
      return;
    }

    setHire(h);

    const [{ data: profile }, { data: details }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", h.helper_id).maybeSingle(),
      supabase.from("helper_details").select("*").eq("user_id", h.helper_id).maybeSingle(),
    ]);

    setHelperProfile(profile);
    setHelper(details);
    setLoading(false);
  };

  const handleEndHire = async () => {
    setEnding(true);
    const { error } = await supabase
      .from("hires")
      .update({ status: "ended", ended_at: new Date().toISOString() } as any)
      .eq("id", hire.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Hire ended" });
      loadData();
    }
    setEnding(false);
  };

  const handleRehire = async () => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("hires")
      .select("id")
      .eq("seeker_id", user.id)
      .eq("helper_id", hire.helper_id)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (existing) {
      toast({ title: "Active hire exists", variant: "destructive" });
      return;
    }

    const { data: convo } = await supabase
      .from("conversations")
      .select("id")
      .eq("seeker_user_id", user.id)
      .eq("helper_user_id", hire.helper_id)
      .maybeSingle();

    const { error } = await supabase.from("hires").insert({
      seeker_id: user.id,
      helper_id: hire.helper_id,
      confirmed_by_seeker: true,
      conversation_id: convo?.id ?? hire.conversation_id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rehire initiated!" });
      navigate("/dashboard");
    }
  };

  const handleMessage = () => {
    if (!hasActiveSubscription) {
      setShowPaywall(true);
      return;
    }
    if (hire.conversation_id) {
      navigate(`/messages?conversation=${hire.conversation_id}`);
    } else {
      navigate("/messages");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!hire || !helperProfile) return null;

  const availabilityLabel = (s: string) => {
    if (s === "available_now") return "Available Now";
    if (s === "available_soon") return "Available Soon";
    return "Not Available";
  };

  const availabilityColor = (s: string) => {
    if (s === "available_now") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (s === "available_soon") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-8">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        {/* Helper Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-start">
              <Avatar
                className="h-20 w-20 cursor-pointer shrink-0"
                onClick={() => navigate(`/helper/${hire.helper_id}`)}
              >
                <AvatarImage src={helperProfile.avatar_url ?? undefined} />
                <AvatarFallback className="text-2xl font-semibold">
                  {helperProfile.full_name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">{helperProfile.full_name}</h1>
                  {helperProfile.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
                  {helper?.is_featured && <Shield className="h-5 w-5 text-amber-500" />}
                </div>

                {helper?.average_rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{helper.average_rating}</span>
                    {helper.total_reviews > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({helper.total_reviews} review{helper.total_reviews !== 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {hire.status === "confirmed" && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Active Hire
                    </Badge>
                  )}
                  {hire.status === "pending" && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      Pending Confirmation
                    </Badge>
                  )}
                  {hire.status === "ended" && (
                    <Badge variant="secondary">Ended</Badge>
                  )}
                  {helper && (
                    <Badge className={availabilityColor(helper.availability_status)}>
                      {availabilityLabel(helper.availability_status)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hire Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Hire Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Job Type</p>
                <div className="flex flex-wrap gap-1">
                  {helper?.work_type?.length > 0
                    ? helper.work_type.map((t: string) => (
                        <Badge key={t} variant="outline" className="text-xs capitalize">
                          {t.replace("_", " ")}
                        </Badge>
                      ))
                    : <span className="text-sm text-muted-foreground">Not specified</span>}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Hire Date
                </p>
                <p className="text-sm">{format(new Date(hire.created_at), "MMMM d, yyyy")}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {helper?.skills?.length > 0
                    ? helper.skills.map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))
                    : <span className="text-sm text-muted-foreground">Not specified</span>}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Location
                </p>
                <p className="text-sm">
                  {[helper?.city, helper?.country].filter(Boolean).join(", ") || "Not specified"}
                </p>
              </div>

              {helper?.languages?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Languages className="h-3 w-3" /> Languages
                  </p>
                  <p className="text-sm">{helper.languages.join(", ")}</p>
                </div>
              )}

              {helper?.preferred_hours && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Work Schedule
                  </p>
                  <p className="text-sm">{helper.preferred_hours}</p>
                </div>
              )}
            </div>

            {/* Contact section */}
            {hasActiveSubscription && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium">Contact Helper</p>
                <Button size="sm" className="gap-1.5" onClick={handleMessage}>
                  <MessageSquare className="h-3.5 w-3.5" /> Send Message
                </Button>
              </div>
            )}

            {!hasActiveSubscription && (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Unlock chat to contact this helper
                </p>
                <Button size="sm" onClick={() => setShowPaywall(true)} className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Unlock Chat — R25
                </Button>
              </div>
            )}

            {/* Trust badges */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Shield className="h-3 w-3" /> Trust & Safety
              </p>
              <div className="flex flex-wrap gap-2">
                {helperProfile.is_verified && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                    <BadgeCheck className="h-3 w-3" /> Identity Verified
                  </Badge>
                )}
                {helper?.background_check_status === "approved" && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
                    <Search className="h-3 w-3" /> Background Checked
                  </Badge>
                )}
                {helper?.background_check_status !== "approved" && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Search className="h-3 w-3" /> Background Check — Coming Soon
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2" onClick={handleMessage}>
            <MessageSquare className="h-4 w-4" /> Message
          </Button>

          {hire.status === "confirmed" && (
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleEndHire}
              disabled={ending}
            >
              <XCircle className="h-4 w-4" />
              {ending ? "Ending..." : "End Hire"}
            </Button>
          )}

          {hire.status === "ended" && (
            <Button className="gap-2" onClick={handleRehire}>
              <RefreshCw className="h-4 w-4" /> Rehire
            </Button>
          )}

          {(hire.status === "confirmed" || hire.status === "ended") && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowReview(true)}
            >
              <Star className="h-4 w-4" /> Leave Review
            </Button>
          )}
        </div>
      </div>

      {showReview && (
        <ReviewHelperDialog
          open={showReview}
          onClose={() => setShowReview(false)}
          helperUserId={hire.helper_id}
          helperName={helperProfile.full_name}
          onReviewSubmitted={loadData}
        />
      )}

      <SeekerPaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
};

export default HireDetails;
