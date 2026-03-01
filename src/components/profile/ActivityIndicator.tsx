import { Circle } from "lucide-react";

interface ActivityIndicatorProps {
  lastActiveAt: string | null;
}

const ActivityIndicator = ({ lastActiveAt }: ActivityIndicatorProps) => {
  if (!lastActiveAt) return null;

  const now = new Date();
  const lastActive = new Date(lastActiveAt);
  const diffMs = now.getTime() - lastActive.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  const diffHours = diffMinutes / 60;
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes <= 10) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
        <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" />
        Active now
      </span>
    );
  }

  if (diffHours <= 24) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
        Active today
      </span>
    );
  }

  if (diffDays <= 30) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        <Circle className="h-2 w-2 fill-muted-foreground/50 text-muted-foreground/50" />
        Last active {diffDays} {diffDays === 1 ? "day" : "days"} ago
      </span>
    );
  }

  return null;
};

export default ActivityIndicator;
