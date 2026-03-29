import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSeekerSubscription } from "@/contexts/SeekerSubscriptionContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Lock } from "lucide-react";
import { useUserCurrency } from "@/hooks/useUserCurrency";

interface SeekerPaywallDialogProps {
  open: boolean;
  onClose: () => void;
}

const SeekerPaywallDialog = ({ open, onClose }: SeekerPaywallDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refresh } = useSeekerSubscription();
  const { formatPrice } = useUserCurrency();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!user) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-seeker-subscription", {
        body: { action: "initialize" },
      });
      if (error) throw error;
      if (data?.authorization_url) {
        localStorage.setItem("seeker_sub_ref", data.reference);
        window.location.href = data.authorization_url;
      } else {
        toast({ title: "Error", description: "Could not initialize payment", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> Unlock Messaging
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/50 p-4 text-center space-y-2">
            <MessageSquare className="mx-auto h-10 w-10 text-primary/60" />
            <h3 className="font-semibold text-foreground text-lg">{formatPrice("seeker_subscription")} for 30 days</h3>
            <p className="text-sm text-muted-foreground">
              Get unlimited access to message helpers, schedule interviews, and make hires.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">✅ Send unlimited messages</li>
            <li className="flex items-center gap-2">✅ Schedule interviews</li>
            <li className="flex items-center gap-2">✅ Hire helpers directly</li>
            <li className="flex items-center gap-2">✅ 30 days of full access</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button onClick={handlePay} disabled={paying}>
            {paying ? "Processing..." : `Pay Now — ${formatPrice("seeker_subscription")}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SeekerPaywallDialog;
