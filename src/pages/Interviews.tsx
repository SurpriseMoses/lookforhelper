import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Video, MapPin, Check, X, Clock, Star, CheckCircle, Phone, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import ReviewDialog from "@/components/interviews/ReviewDialog";
import HireConfirmation from "@/components/interviews/HireConfirmation";

const METHOD_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp Call",
  phone: "Phone Call",
  google_meet: "Google Meet",
};

const METHOD_ICONS: Record<string, typeof Video> = {
  whatsapp: MessageCircle,
  phone: Phone,
  google_meet: Video,
};

interface Interview {
  id: string;
  seeker_user_id: string;
  helper_user_id: string;
  interview_type: string;
  meeting_method: string | null;
  status: string;
  proposed_date: string;
  location: string | null;
  meeting_link: string | null;
  seeker_message: string | null;
  helper_response: string | null;
  created_at: string;
  other_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-muted text-muted-foreground",
};

const Interviews = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{ interviewId: string; revieweeId: string; revieweeName: string } | null>(null);
  const [existingReviews, setExistingReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    loadInterviews();
    loadExistingReviews();
  }, [user]);

  const loadExistingReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reviews")
      .select("interview_id")
      .eq("reviewer_user_id", user.id);
    setExistingReviews(new Set((data ?? []).map((r) => r.interview_id)));
  };

  const loadInterviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("interviews")
      .select("*")
      .or(`seeker_user_id.eq.${user.id},helper_user_id.eq.${user.id}`)
      .order("proposed_date", { ascending: true });

    if (!data || data.length === 0) {
      setInterviews([]);
      setLoading(false);
      return;
    }

    const otherIds = data.map((i) =>
      i.seeker_user_id === user.id ? i.helper_user_id : i.seeker_user_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", otherIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

    setInterviews(
      data.map((i) => ({
        ...i,
        other_name:
          profileMap.get(i.seeker_user_id === user.id ? i.helper_user_id : i.seeker_user_id) ?? "User",
      }))
    );
    setLoading(false);
  };

  const handleRespond = async (interviewId: string, status: "accepted" | "declined") => {
    const { error } = await supabase
      .from("interviews")
      .update({ status, helper_response: responseText || null })
      .eq("id", interviewId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Interview ${status}!` });
      setRespondingId(null);
      setResponseText("");
      loadInterviews();
    }
  };

  const handleCancel = async (interviewId: string) => {
    const { error } = await supabase
      .from("interviews")
      .update({ status: "cancelled" })
      .eq("id", interviewId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Interview cancelled" });
      loadInterviews();
    }
  };

  const handleMarkComplete = async (interviewId: string) => {
    const { error } = await supabase
      .from("interviews")
      .update({ status: "completed" })
      .eq("id", interviewId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Interview marked as completed!" });
      loadInterviews();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Please sign in to view interviews.</p>
          <Button asChild className="mt-4">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-8">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Interviews</h1>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading interviews...</div>
        ) : interviews.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Calendar className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p>No interviews yet.</p>
            {(role === "seeker" || role === "admin") && (
              <p className="mt-1 text-sm">
                Start a conversation with a helper and book an interview from the chat.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => {
              const isHelper = interview.helper_user_id === user.id;
              const isPending = interview.status === "pending";

              return (
                <Card key={interview.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-foreground">{interview.other_name}</h3>
                        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          {interview.interview_type === "video" ? (
                            (() => {
                              const method = interview.meeting_method || "google_meet";
                              const MethodIcon = METHOD_ICONS[method] || Video;
                              return (
                                <span className="flex items-center gap-1">
                                  <MethodIcon className="h-4 w-4" /> {METHOD_LABELS[method] || "Video Call"}
                                </span>
                              );
                            })()
                          ) : (
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> In-Person</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(interview.proposed_date), "MMM d, yyyy 'at' HH:mm")}
                          </span>
                        </div>
                        {interview.location && (
                          <p className="mt-1 text-sm text-muted-foreground">📍 {interview.location}</p>
                        )}
                        {interview.meeting_link && (
                          <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-primary hover:underline block">
                            🔗 Join Meeting
                          </a>
                        )}
                        {interview.seeker_message && (
                          <p className="mt-2 text-sm text-muted-foreground italic">"{interview.seeker_message}"</p>
                        )}
                        {interview.helper_response && (
                          <p className="mt-1 text-sm text-foreground">Response: {interview.helper_response}</p>
                        )}
                      </div>
                      <Badge className={STATUS_COLORS[interview.status] ?? ""}>
                        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Helper actions for pending interviews */}
                    {isHelper && isPending && (
                      <div className="mt-4 space-y-3 border-t pt-4">
                        {respondingId === interview.id ? (
                          <>
                            <Textarea
                              placeholder="Add a response message (optional)"
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleRespond(interview.id, "accepted")} className="gap-1">
                                <Check className="h-4 w-4" /> Accept
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRespond(interview.id, "declined")} className="gap-1">
                                <X className="h-4 w-4" /> Decline
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setRespondingId(null)}>Cancel</Button>
                            </div>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setRespondingId(interview.id)}>
                            Respond
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Seeker can cancel pending interviews */}
                    {!isHelper && isPending && (
                      <div className="mt-4 border-t pt-4">
                        <Button size="sm" variant="outline" onClick={() => handleCancel(interview.id)}>
                          Cancel Request
                        </Button>
                      </div>
                    )}

                    {/* Mark as completed for accepted interviews */}
                    {interview.status === "accepted" && (
                      <div className="mt-4 border-t pt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkComplete(interview.id)}
                          className="gap-1"
                        >
                          <CheckCircle className="h-4 w-4" /> Mark as Completed
                        </Button>
                      </div>
                    )}

                    {/* Review & Hire for completed interviews */}
                    {interview.status === "completed" && (
                      <div className="mt-4 border-t pt-4 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!existingReviews.has(interview.id) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setReviewTarget({
                                  interviewId: interview.id,
                                  revieweeId: isHelper ? interview.seeker_user_id : interview.helper_user_id,
                                  revieweeName: interview.other_name,
                                })
                              }
                              className="gap-1"
                            >
                              <Star className="h-4 w-4" /> Leave Review
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Reviewed
                            </span>
                          )}
                        </div>
                        <HireConfirmation
                          interviewId={interview.id}
                          seekerUserId={interview.seeker_user_id}
                          helperUserId={interview.helper_user_id}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      {reviewTarget && (
        <ReviewDialog
          open={!!reviewTarget}
          onClose={() => {
            setReviewTarget(null);
            loadExistingReviews();
          }}
          interviewId={reviewTarget.interviewId}
          revieweeUserId={reviewTarget.revieweeId}
          revieweeName={reviewTarget.revieweeName}
        />
      )}
    </div>
  );
};

export default Interviews;
