import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props { institutionId: string; className?: string }

const SaveInstitutionButton = ({ institutionId, className = "" }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("saved_institutions")
      .select("id")
      .eq("helper_id", user.id)
      .eq("institution_id", institutionId)
      .maybeSingle()
      .then(({ data }) => { if (data) setSaved(true); });
  }, [user, institutionId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Sign in to save institutions", variant: "destructive" });
      return;
    }
    setLoading(true);
    if (saved) {
      await supabase.from("saved_institutions").delete().eq("helper_id", user.id).eq("institution_id", institutionId);
      setSaved(false);
    } else {
      await supabase.from("saved_institutions").insert({ helper_id: user.id, institution_id: institutionId });
      setSaved(true);
      toast({ title: "Institution saved!" });
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm transition-colors hover:bg-background ${className}`}
      aria-label={saved ? "Remove from saved" : "Save institution"}
    >
      <Heart className={`h-4 w-4 transition-colors ${saved ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
    </button>
  );
};

export default SaveInstitutionButton;
