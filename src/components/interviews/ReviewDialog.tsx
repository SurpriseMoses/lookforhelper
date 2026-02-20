import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  interviewId: string;
  revieweeUserId: string;
  revieweeName: string;
}

const ReviewDialog = ({ open, onClose, interviewId, revieweeUserId, revieweeName }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      interview_id: interviewId,
      reviewer_user_id: user.id,
      reviewee_user_id: revieweeUserId,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already reviewed", description: "You've already left a review for this interview.", variant: "destructive" });
      } else {
        toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Review submitted!" });
      onClose();
    }
    setSubmitting(false);
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Review {revieweeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-0.5 transition-colors"
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= displayRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Comment (optional)</Label>
            <Textarea
              rows={3}
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
