import { Zap, Clock } from "lucide-react";

interface ResponseTimeBadgeProps {
  avgResponseMinutes: number | null;
  compact?: boolean;
}

const ResponseTimeBadge = ({ avgResponseMinutes, compact = false }: ResponseTimeBadgeProps) => {
  if (avgResponseMinutes === null || avgResponseMinutes === undefined) {
    return null;
  }

  const minutes = Math.round(avgResponseMinutes);

  if (minutes <= 60) {
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? 'text-[9px]' : 'text-[10px]'} font-medium text-amber-700`}>
        <Zap className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} fill-amber-500 text-amber-500`} />
        {compact ? '< 1hr' : 'Replies within 1 hour'}
      </span>
    );
  }

  if (minutes <= 1440) {
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? 'text-[9px]' : 'text-[10px]'} font-medium text-muted-foreground`}>
        <Clock className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
        {compact ? '< 24hr' : 'Replies within 24 hours'}
      </span>
    );
  }

  return null;
};

export default ResponseTimeBadge;
