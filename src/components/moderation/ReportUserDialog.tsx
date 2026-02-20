import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const REPORT_REASONS = [
  "Inappropriate behavior",
  "Spam or scam",
  "Fake profile",
  "Harassment",
  "Misleading information",
  "Other",
];

interface Props {
  open: boolean;
  onClose: () => void;
  reportedUserId: string;
  contextType?: "profile" | "message" | "interview";
  contextId?: string;
}

const ReportUserDialog = ({ open, onClose, reportedUserId, contextType = "profile", contextId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);

    const { error } = await supabase.from("reports").insert({
      reporter_user_id: user.id,
      reported_user_id: reportedUserId,
      reason,
      details: details.trim() || null,
      context_type: contextType,
      context_id: contextId || null,
    });

    if (error) {
      toast({ title: "Failed to submit report", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Report submitted", description: "An admin will review this report." });
      setReason("");
      setDetails("");
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Report User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional details (optional)</Label>
            <Textarea
              rows={3}
              placeholder="Provide more context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason}>
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserDialog;
