import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Lock, ShieldAlert } from "lucide-react";
import { useSeekerSubscription } from "@/contexts/SeekerSubscriptionContext";
import SeekerPaywallDialog from "@/components/subscription/SeekerPaywallDialog";

interface Props {
  helperUserId: string;
}

const ContactHelperButton = ({ helperUserId }: Props) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasActiveSubscription } = useSeekerSubscription();
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleContact = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (role !== "seeker" && role !== "admin") {
      toast({ title: "Only seekers can message helpers", variant: "destructive" });
      return;
    }

    if (!acknowledged) {
      toast({ title: "Please acknowledge the safety reminder before continuing", variant: "destructive" });
      return;
    }

    // Check subscription
    if (!hasActiveSubscription) {
      setShowPaywall(true);
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

  const isLocked = role === "seeker" && !hasActiveSubscription;
  const isSeeker = role === "seeker";

  return (
    <>
      <div className="mt-8 rounded-xl border bg-muted/50 p-6">
        {/* Safety Reminder for seekers */}
        {isSeeker && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-3">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">Before hiring a helper, we recommend:</p>
                <ul className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed space-y-0.5">
                  <li>• Conducting a phone or video interview</li>
                  <li>• Meeting in person in a safe place</li>
                  <li>• Verifying identity documents</li>
                </ul>
              </div>
            </div>
            <label className="flex items-start gap-2 mt-3 cursor-pointer">
              <Checkbox
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
                className="mt-0.5"
              />
              <span className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                I understand that I am responsible for confirming identity and references before hiring.
              </span>
            </label>
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center">
          {isLocked
            ? "Messaging requires an active plan (R25 / 30 days)"
            : "Interested in this helper? Send them a message to get started."}
        </p>
        <div className="text-center">
          <Button
            onClick={handleContact}
            disabled={loading || (isSeeker && !acknowledged)}
            className="mt-3 gap-2"
          >
            {isLocked ? (
              <><Lock className="h-4 w-4" /> Unlock Messaging</>
            ) : (
              <><MessageSquare className="h-4 w-4" /> {loading ? "Starting..." : "Contact Helper"}</>
            )}
          </Button>
        </div>
      </div>

      <SeekerPaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  );
};

export default ContactHelperButton;
