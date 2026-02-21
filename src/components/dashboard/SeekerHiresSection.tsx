import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSeekerSubscription } from "@/contexts/SeekerSubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ReviewHelperDialog from "@/components/reviews/ReviewHelperDialog";
import SeekerPaywallDialog from "@/components/subscription/SeekerPaywallDialog";
import {
  Briefcase,
  MessageSquare,
  Video,
  XCircle,
  Star,
  Clock,
  CheckCircle2,
  Shield,
  BadgeCheck,
  History,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface HireWithProfile {
  id: string;
  helper_id: string;
  seeker_id: string;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  ended_at: string | null;
  confirmed_by_helper: boolean;
  confirmed_by_seeker: boolean;
  helper_name: string;
  helper_avatar: string | null;
  helper_skills: string[];
  helper_availability: string;
  helper_is_verified: boolean;
  helper_is_featured: boolean;
  helper_rating: number | null;
  conversation_id: string | null;
}

const SeekerHiresSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasActiveSubscription } = useSeekerSubscription();
  const [hires, setHires] = useState<HireWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string } | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadHires();
  }, [user]);

  const loadHires = async () => {
    if (!user) return;

    const { data: hiresData } = await supabase
      .from("hires")
      .select("*")
      .eq("seeker_id", user.id)
      .order("created_at", { ascending: false });

    if (!hiresData || hiresData.length === 0) {
      setHires([]);
      setLoading(false);
      return;
    }

    const helperIds = hiresData.map((h: any) => h.helper_id);

    const [{ data: profiles }, { data: details }] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, is_verified")
        .in("user_id", helperIds),
      supabase
        .from("helper_details")
        .select("user_id, skills, availability_status, is_featured, average_rating")
        .in("user_id", helperIds),
    ]);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p])
    );
    const detailMap = new Map(
      (details ?? []).map((d) => [d.user_id, d])
    );

    setHires(
      hiresData.map((h: any) => {
        const p = profileMap.get(h.helper_id);
        const d = detailMap.get(h.helper_id);
        return {
          ...h,
          helper_name: p?.full_name ?? "Helper",
          helper_avatar: p?.avatar_url ?? null,
          helper_is_verified: p?.is_verified ?? false,
          helper_skills: d?.skills ?? [],
          helper_availability: d?.availability_status ?? "not_available",
          helper_is_featured: d?.is_featured ?? false,
          helper_rating: d?.average_rating ?? null,
        };
      })
    );
    setLoading(false);
  };

  const handleEndHire = async (hire: HireWithProfile) => {
    setEndingId(hire.id);
    const { error } = await supabase
      .from("hires")
      .update({ status: "ended", ended_at: new Date().toISOString() } as any)
      .eq("id", hire.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Hire ended successfully" });
      loadHires();
    }
    setEndingId(null);
  };

  const handleMessage = (hire: HireWithProfile) => {
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

  const handleVideoCall = () => {
    toast({ title: "Coming Soon", description: "Video calling will be available soon." });
  };

  const handleRehire = async (hire: HireWithProfile) => {
    if (!user) return;
    // Check for existing active/pending hire with same helper
    const { data: existing } = await supabase
      .from("hires")
      .select("id")
      .eq("seeker_id", user.id)
      .eq("helper_id", hire.helper_id)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (existing) {
      toast({ title: "Active hire exists", description: "You already have an active hire with this helper.", variant: "destructive" });
      return;
    }

    // Need a conversation_id — check if one exists
    const { data: convo } = await supabase
      .from("conversations")
      .select("id")
      .eq("seeker_user_id", user.id)
      .eq("helper_user_id", hire.helper_id)
      .maybeSingle();

    const conversationId = convo?.id ?? hire.conversation_id;

    const { error } = await supabase.from("hires").insert({
      seeker_id: user.id,
      helper_id: hire.helper_id,
      confirmed_by_seeker: true,
      conversation_id: conversationId,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rehire initiated!", description: "Waiting for helper confirmation." });
      loadHires();
    }
  };

  const activeHires = hires.filter((h) => h.status === "confirmed" || h.status === "pending");
  const endedHires = hires.filter((h) => h.status === "ended");

  if (loading) return null;

  const availabilityLabel = (status: string) => {
    switch (status) {
      case "available_now": return "Available Now";
      case "available_soon": return "Available Soon";
      default: return "Not Available";
    }
  };

  const availabilityColor = (status: string) => {
    switch (status) {
      case "available_now": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "available_soon": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-red-100 text-red-800 border-red-200";
    }
  };

  const renderHireCard = (hire: HireWithProfile, isHistory = false) => (
    <Card key={hire.id} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar
            className="h-14 w-14 cursor-pointer shrink-0"
            onClick={() => navigate(`/helper/${hire.helper_id}`)}
          >
            <AvatarImage src={hire.helper_avatar ?? undefined} />
            <AvatarFallback className="text-lg font-semibold">
              {hire.helper_name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="font-semibold text-foreground cursor-pointer hover:underline truncate"
                onClick={() => navigate(`/helper/${hire.helper_id}`)}
              >
                {hire.helper_name}
              </h3>
              {hire.helper_is_verified && (
                <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
              )}
              {hire.helper_is_featured && (
                <Shield className="h-4 w-4 text-amber-500 shrink-0" />
              )}
            </div>

            {hire.helper_skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {hire.helper_skills.slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
                {hire.helper_skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{hire.helper_skills.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Hired {format(new Date(hire.created_at), "MMM d, yyyy")}
              </span>
              {!isHistory && (
                <Badge className={`text-xs ${availabilityColor(hire.helper_availability)}`}>
                  {availabilityLabel(hire.helper_availability)}
                </Badge>
              )}
              {hire.status === "pending" && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                  Pending Confirmation
                </Badge>
              )}
              {hire.status === "confirmed" && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </Badge>
              )}
              {hire.helper_rating !== null && hire.helper_rating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {hire.helper_rating}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {!isHistory ? (
            <>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleMessage(hire)}>
                <MessageSquare className="h-3.5 w-3.5" /> Message
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleVideoCall}>
                <Video className="h-3.5 w-3.5" /> Video Call
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/hire/${hire.id}`)}>
                <Briefcase className="h-3.5 w-3.5" /> Details
              </Button>
              {hire.status === "confirmed" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => setReviewTarget({ id: hire.helper_id, name: hire.helper_name })}
                  >
                    <Star className="h-3.5 w-3.5" /> Review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => handleEndHire(hire)}
                    disabled={endingId === hire.id}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {endingId === hire.id ? "Ending..." : "End Hire"}
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setReviewTarget({ id: hire.helper_id, name: hire.helper_name })}
              >
                <Star className="h-3.5 w-3.5" /> Leave Review
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => handleRehire(hire)}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Rehire
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {hires.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Manage Hires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="active" className="flex-1 gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Active ({activeHires.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 gap-1.5">
                  <History className="h-4 w-4" />
                  History ({endedHires.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-3">
                {activeHires.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No active hires yet. Browse helpers to get started!
                  </p>
                ) : (
                  activeHires.map((h) => renderHireCard(h))
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-3">
                {endedHires.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No completed hires yet.
                  </p>
                ) : (
                  endedHires.map((h) => renderHireCard(h, true))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {reviewTarget && (
        <ReviewHelperDialog
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          helperUserId={reviewTarget.id}
          helperName={reviewTarget.name}
          onReviewSubmitted={loadHires}
        />
      )}

      <SeekerPaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  );
};

export default SeekerHiresSection;
