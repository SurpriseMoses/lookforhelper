import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Video, MapPin } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  helperUserId: string;
  conversationId: string;
}

const InterviewRequestDialog = ({ open, onClose, helperUserId, conversationId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [type, setType] = useState<"video" | "in_person">("video");
  const [proposedDate, setProposedDate] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !proposedDate) return;
    setSubmitting(true);

    const { error } = await supabase.from("interviews").insert({
      seeker_user_id: user.id,
      helper_user_id: helperUserId,
      conversation_id: conversationId,
      interview_type: type,
      proposed_date: new Date(proposedDate).toISOString(),
      location: type === "in_person" ? location : null,
      meeting_link: type === "video" ? meetingLink : null,
      seeker_message: message || null,
    });

    if (error) {
      toast({ title: "Failed to send request", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Interview request sent!" });
      // Also send a message in the conversation
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `📅 Interview request sent: ${type === "video" ? "Video Call" : "In-Person"} on ${new Date(proposedDate).toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      });
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Book an Interview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Interview Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "video" | "in_person")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">
                  <span className="flex items-center gap-2"><Video className="h-4 w-4" /> Video Call</span>
                </SelectItem>
                <SelectItem value="in_person">
                  <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> In-Person</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Proposed Date & Time</Label>
            <Input
              type="datetime-local"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
            />
          </div>

          {type === "video" && (
            <div className="space-y-2">
              <Label>Meeting Link (optional)</Label>
              <Input
                placeholder="e.g. https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          )}

          {type === "in_person" && (
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g. 123 Main St, Johannesburg"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Message to Helper (optional)</Label>
            <Textarea
              rows={3}
              placeholder="Add a note about the interview..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !proposedDate}>
              {submitting ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewRequestDialog;
