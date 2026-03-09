import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  otherPartyId: string;
  otherPartyName: string;
  hireId?: string;
}

const DISPUTE_REASONS = [
  "Helper did not show up",
  "Quality of work was poor",
  "Payment dispute",
  "Unprofessional behavior",
  "Safety concern",
  "Other",
];

const DisputeDialog = ({ open, onClose, otherPartyId, otherPartyName, hireId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("disputes" as any)
      .insert({
        reporter_id: user.id,
        other_party_id: otherPartyId,
        hire_id: hireId || null,
        reason,
        details: details || null,
      } as any);

    if (error) {
      toast({ title: "Failed to submit dispute", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dispute submitted", description: "Our team will review and contact both parties." });
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Raise a Dispute
          </DialogTitle>
          <DialogDescription>
            Submit a dispute about your experience with {otherPartyName}. Our admin team will review and mediate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {DISPUTE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Details</label>
            <Textarea
              placeholder="Describe what happened..."
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            variant="destructive"
          >
            {submitting ? "Submitting..." : "Submit Dispute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisputeDialog;
