import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Briefcase } from "lucide-react";

interface Props {
  conversationId: string;
  helperUserId: string;
  seekerUserId: string;
}

const MarkAsHiredButton = ({ conversationId, helperUserId, seekerUserId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleMarkHired = async () => {
    if (!user) return;
    setLoading(true);

    const isSeeker = user.id === seekerUserId;

    const { error } = await supabase.from("hires").insert({
      helper_id: helperUserId,
      seeker_id: seekerUserId,
      conversation_id: conversationId,
      confirmed_by_seeker: isSeeker,
      confirmed_by_helper: !isSeeker,
    } as any);

    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        toast({ title: "Already marked as hired" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Marked as hired! The other party will be notified to confirm." });
      setDone(true);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <span className="text-xs text-emerald-600 flex items-center gap-1">
        <Briefcase className="h-3.5 w-3.5" /> Hire submitted
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkHired}
      disabled={loading}
      className="gap-1"
    >
      <Briefcase className="h-4 w-4" />
      {loading ? "Submitting..." : "Mark as Hired"}
    </Button>
  );
};

export default MarkAsHiredButton;
