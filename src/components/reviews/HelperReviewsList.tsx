import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  seeker_name: string;
  seeker_avatar: string | null;
}

interface HelperReviewsListProps {
  helperUserId: string;
  refreshKey?: number;
}

const HelperReviewsList = ({ helperUserId, refreshKey }: HelperReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data: reviewData } = await supabase
        .from("helper_reviews")
        .select("id, rating, comment, created_at, seeker_id")
        .eq("helper_id", helperUserId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!reviewData || reviewData.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const seekerIds = reviewData.map((r: any) => r.seeker_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", seekerIds);

      const profileMap = new Map(
        (profiles ?? []).map((p: any) => [p.user_id, p])
      );

      setReviews(
        reviewData.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          seeker_name: profileMap.get(r.seeker_id)?.full_name ?? "User",
          seeker_avatar: profileMap.get(r.seeker_id)?.avatar_url ?? null,
        }))
      );
      setLoading(false);
    };

    fetchReviews();
  }, [helperUserId, refreshKey]);

  if (loading) return null;
  if (reviews.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="font-display text-lg font-semibold text-foreground">Reviews</h2>
      <div className="mt-3 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                {review.seeker_avatar ? (
                  <img src={review.seeker_avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-bold text-muted-foreground/50">
                    {review.seeker_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{review.seeker_name}</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>
            {review.comment && (
              <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelperReviewsList;
