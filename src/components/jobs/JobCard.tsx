import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Globe, Navigation, Clock, Heart, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: {
    id: string;
    seeker_id: string;
    title: string;
    description: string | null;
    skills: string[];
    location_preference: string;
    city: string | null;
    country: string | null;
    created_at: string;
    seeker_name?: string;
    seeker_avatar?: string | null;
  };
  hasResponded?: boolean;
  responseCount?: number;
  onResponseChange?: () => void;
}

const LOCATION_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  near_me: { label: "Near me", icon: <Navigation className="h-3.5 w-3.5" /> },
  country: { label: "In country", icon: <MapPin className="h-3.5 w-3.5" /> },
  global: { label: "Global", icon: <Globe className="h-3.5 w-3.5" /> },
};

const JobCard = ({ job, hasResponded = false, responseCount = 0, onResponseChange }: JobCardProps) => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [responded, setResponded] = useState(hasResponded);
  const [loading, setLoading] = useState(false);

  const isHelper = role === "helper";
  const isOwner = user?.id === job.seeker_id;

  const handleInterested = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("job_responses" as any).insert({
      job_id: job.id,
      helper_id: user.id,
    } as any);
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "You already responded to this job" });
      } else {
        toast({ title: "Failed to respond", description: error.message, variant: "destructive" });
      }
      return;
    }

    setResponded(true);
    toast({ title: "Interest sent! The seeker will be notified." });
    onResponseChange?.();
  };

  const loc = LOCATION_LABELS[job.location_preference] || LOCATION_LABELS.country;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header with seeker avatar */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0 border">
            {job.seeker_avatar ? (
              <AvatarImage src={job.seeker_avatar} alt={job.seeker_name} />
            ) : null}
            <AvatarFallback className="text-xs font-semibold">
              {job.seeker_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground leading-tight line-clamp-2">{job.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {job.seeker_name || "Seeker"} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {job.skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>

        {/* Location + meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {loc.icon}
            {loc.label}
            {job.city && job.location_preference === "near_me" && ` · ${job.city}`}
            {job.country && job.location_preference === "country" && ` · ${job.country}`}
          </span>
          {isOwner && (
            <span className="ml-auto flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {responseCount} interested
            </span>
          )}
        </div>

        {/* Action */}
        {isHelper && !isOwner && (
          <Button
            size="sm"
            variant={responded ? "secondary" : "default"}
            disabled={responded || loading}
            onClick={handleInterested}
            className="w-full gap-1.5"
          >
            {responded ? (
              <><Check className="h-4 w-4" /> Interest Sent</>
            ) : (
              loading ? "Sending..." : "I'm Interested"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default JobCard;
