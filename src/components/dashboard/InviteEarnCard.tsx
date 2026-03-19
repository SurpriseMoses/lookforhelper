import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, CheckCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const InviteEarnCard = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState({ total: 0, completed: 0, rewards: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.referral_code) setReferralCode(profile.referral_code);

      const { data: referrals } = await supabase
        .from("referrals")
        .select("status, reward_given")
        .eq("referrer_id", user.id);

      const all = referrals ?? [];
      setStats({
        total: all.length,
        completed: all.filter((r: any) => r.status === "completed").length,
        rewards: all.filter((r: any) => r.reward_given).length,
      });
    };
    load();
  }, [user]);

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Referral link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!referralCode) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Invite & Earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Your referral link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border bg-background px-3 py-2 text-xs font-mono text-foreground truncate">
              {referralLink}
            </code>
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 shrink-0">
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Code: <span className="font-mono font-bold tracking-widest">{referralCode}</span></p>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Invite friends and earn rewards:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong>Helpers:</strong> Get 3 days Featured when they complete Verified Identity</li>
            <li><strong>Seekers:</strong> Get 7 extra days when they buy Messaging</li>
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-lg font-bold text-foreground">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-lg font-bold text-foreground">{stats.rewards}</p>
            <p className="text-xs text-muted-foreground">Rewards Earned</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InviteEarnCard;
