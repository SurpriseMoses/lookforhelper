import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

interface Props {
  helperUserId: string;
}

const ContactHelperButton = ({ helperUserId }: Props) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleContact = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (role !== "seeker") {
      toast({ title: "Only seekers can message helpers", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Check for existing conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("seeker_user_id", user.id)
      .eq("helper_user_id", helperUserId)
      .maybeSingle();

    if (existing) {
      navigate(`/messages?conversation=${existing.id}`);
      setLoading(false);
      return;
    }

    // Create new conversation
    const { data: newConvo, error } = await supabase
      .from("conversations")
      .insert({ seeker_user_id: user.id, helper_user_id: helperUserId })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Failed to start conversation", description: error.message, variant: "destructive" });
    } else {
      navigate(`/messages?conversation=${newConvo.id}`);
    }
    setLoading(false);
  };

  return (
    <div className="mt-8 rounded-xl border bg-muted/50 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        Interested in this helper? Send them a message to get started.
      </p>
      <Button onClick={handleContact} disabled={loading} className="mt-3 gap-2">
        <MessageSquare className="h-4 w-4" /> {loading ? "Starting..." : "Contact Helper"}
      </Button>
    </div>
  );
};

export default ContactHelperButton;
