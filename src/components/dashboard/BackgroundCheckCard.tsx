import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Bell } from "lucide-react";
import { useUserCurrency } from "@/hooks/useUserCurrency";

const BackgroundCheckCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("helper_details")
        .select("background_check_requested, background_check_status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setRequested((data as any).background_check_requested ?? false);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleNotifyMe = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("helper_details")
      .update({ background_check_requested: true } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Create a notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "payment_success",
      title: "Background Check Coming Soon",
      body: "We'll notify you when Background Checks are available.",
      link: "/dashboard",
    } as any);

    setRequested(true);
    toast({ title: "You'll be notified when Background Checks become available." });
  };

  if (loading) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-muted-foreground" />
            Background Check
          </CardTitle>
          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Build more trust with seekers by verifying your criminal record and safety status.
        </p>
        <p className="text-sm font-medium text-foreground">
          R149 once-off <span className="text-xs text-muted-foreground font-normal">(when available)</span>
        </p>
        {requested ? (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
            <Bell className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              You will be notified when Background Checks become available.
            </p>
          </div>
        ) : (
          <Button variant="outline" onClick={handleNotifyMe} className="gap-2">
            <Bell className="h-4 w-4" /> Notify Me
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BackgroundCheckCard;
