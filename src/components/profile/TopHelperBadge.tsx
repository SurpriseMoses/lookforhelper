import { Star } from "lucide-react";

interface TopHelperBadgeProps {
  averageRating: number;
  completedHires: number;
  isVerified: boolean;
}

const TopHelperBadge = ({ averageRating, completedHires, isVerified }: TopHelperBadgeProps) => {
  if (averageRating < 4.5 || completedHires < 5 || !isVerified) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-200">
      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Top Helper
    </span>
  );
};

export default TopHelperBadge;
