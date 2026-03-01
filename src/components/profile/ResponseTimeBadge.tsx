import { Zap, Clock } from "lucide-react";

interface ResponseTimeBadgeProps {
  avgResponseMinutes: number | null;
  responseCount: number;
}

const ResponseTimeBadge = ({ avgResponseMinutes, responseCount }: ResponseTimeBadgeProps) => {
  if (!avgResponseMinutes || responseCount < 3) return null;

  if (avgResponseMinutes <= 60) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
        <Zap className="h-3 w-3" /> Replies within 1 hour
      </span>
    );
  }

  if (avgResponseMinutes <= 1440) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        <Clock className="h-3 w-3" /> Replies within 24 hours
      </span>
    );
  }

  return null;
};

export default ResponseTimeBadge;
