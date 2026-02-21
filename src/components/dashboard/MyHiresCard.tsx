import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HireRecord {
  id: string;
  helper_id: string;
  seeker_id: string;
  confirmed_by_helper: boolean;
  confirmed_by_seeker: boolean;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  other_name: string;
}

const MyHiresCard = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [hires, setHires] = useState<HireRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadHires();
  }, [user]);

  const loadHires = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("hires")
      .select("*")
      .or(`helper_id.eq.${user.id},seeker_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setHires([]);
      setLoading(false);
      return;
    }

    const otherIds = data.map((h: any) =>
      h.helper_id === user.id ? h.seeker_id : h.helper_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", otherIds);

    const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

    setHires(
      data.map((h: any) => ({
        ...h,
        other_name: nameMap.get(h.helper_id === user.id ? h.seeker_id : h.helper_id) ?? "User",
      }))
    );
    setLoading(false);
  };

  const handleConfirm = async (hire: HireRecord) => {
    if (!user) return;
    setConfirming(hire.id);

    const isSeeker = user.id === hire.seeker_id;
    const update = isSeeker
      ? { confirmed_by_seeker: true }
      : { confirmed_by_helper: true };

    const { error } = await supabase
      .from("hires")
      .update(update)
      .eq("id", hire.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Hire confirmed on your side!" });
      loadHires();
    }
    setConfirming(null);
  };

  if (loading || hires.length === 0) return null;

  const confirmedCount = hires.filter((h) => h.status === "confirmed").length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5" /> My Hires
          {confirmedCount > 0 && (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
              {confirmedCount} confirmed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {role === "helper" && confirmedCount > 0 && (
          <p className="text-sm text-muted-foreground">
            ✔ Hired {confirmedCount} {confirmedCount === 1 ? "time" : "times"} through Look for Helper
          </p>
        )}
        {hires.map((hire) => {
          const isSeeker = user?.id === hire.seeker_id;
          const myConfirmed = isSeeker ? hire.confirmed_by_seeker : hire.confirmed_by_helper;
          const otherConfirmed = isSeeker ? hire.confirmed_by_helper : hire.confirmed_by_seeker;

          return (
            <div key={hire.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{hire.other_name}</p>
                {hire.status === "confirmed" ? (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed by both
                  </span>
                ) : myConfirmed ? (
                  <span className="text-xs text-muted-foreground">
                    You confirmed • {otherConfirmed ? "" : "Waiting for other party"}
                  </span>
                ) : (
                  <span className="text-xs text-amber-600">Pending your confirmation</span>
                )}
              </div>
              {!myConfirmed && hire.status !== "confirmed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConfirm(hire)}
                  disabled={confirming === hire.id}
                  className="gap-1"
                >
                  <Briefcase className="h-4 w-4" />
                  {confirming === hire.id ? "Confirming..." : "Confirm"}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MyHiresCard;
