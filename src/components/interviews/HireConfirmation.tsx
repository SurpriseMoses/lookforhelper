import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, CheckCircle2 } from "lucide-react";

interface Props {
  interviewId: string;
  seekerUserId: string;
  helperUserId: string;
}

interface HireRecord {
  id: string;
  seeker_confirmed: boolean;
  helper_confirmed: boolean;
  confirmed_at: string | null;
}

const HireConfirmation = ({ interviewId, seekerUserId, helperUserId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hire, setHire] = useState<HireRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const isSeeker = user?.id === seekerUserId;

  useEffect(() => {
    loadHire();
  }, [interviewId]);

  const loadHire = async () => {
    const { data } = await supabase
      .from("job_hires")
      .select("id, seeker_confirmed, helper_confirmed, confirmed_at")
      .eq("interview_id", interviewId)
      .maybeSingle();
    setHire(data);
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!user) return;
    setConfirming(true);

    if (!hire) {
      // Create new hire record
      const { error } = await supabase.from("job_hires").insert({
        interview_id: interviewId,
        seeker_user_id: seekerUserId,
        helper_user_id: helperUserId,
        seeker_confirmed: isSeeker,
        helper_confirmed: !isSeeker,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Hire confirmed on your side!" });
        loadHire();
      }
    } else {
      // Update existing record
      const update = isSeeker ? { seeker_confirmed: true } : { helper_confirmed: true };
      const { error } = await supabase
        .from("job_hires")
        .update(update)
        .eq("id", hire.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Hire confirmed on your side!" });
        loadHire();
      }
    }
    setConfirming(false);
  };

  if (loading) return null;

  const myConfirmed = hire
    ? isSeeker ? hire.seeker_confirmed : hire.helper_confirmed
    : false;
  const otherConfirmed = hire
    ? isSeeker ? hire.helper_confirmed : hire.seeker_confirmed
    : false;
  const fullyConfirmed = hire?.confirmed_at != null;

  if (fullyConfirmed) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Hire confirmed by both sides
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {myConfirmed ? (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          You confirmed • {otherConfirmed ? "" : "Waiting for other party"}
        </span>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={handleConfirm}
          disabled={confirming}
          className="gap-1"
        >
          <Briefcase className="h-4 w-4" />
          {confirming ? "Confirming..." : "Confirm Hire"}
        </Button>
      )}
    </div>
  );
};

export default HireConfirmation;
