import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell } from "lucide-react";

interface SaveSearchDialogProps {
  open: boolean;
  onClose: () => void;
  filters: Record<string, any>;
}

const SaveSearchDialog = ({ open, onClose, filters }: SaveSearchDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from("saved_searches" as any)
      .insert({
        user_id: user.id,
        name: name.trim(),
        filters,
        notify_new_matches: true,
      } as any);

    if (error) {
      toast({ title: "Failed to save search", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Search saved!", description: "You'll be notified when new helpers match your criteria." });
      onClose();
      setName("");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Save This Search
          </DialogTitle>
          <DialogDescription>
            Get notified when new helpers match your current filters.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Input
            placeholder="e.g. Nannies in Johannesburg"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Saving..." : "Save & Alert Me"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSearchDialog;
