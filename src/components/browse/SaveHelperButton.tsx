import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  helperUserId: string;
  className?: string;
}

const SaveHelperButton = ({ helperUserId, className = "" }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("helper_user_id", helperUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSaved(true);
      });
  }, [user, helperUserId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Sign in to save helpers", variant: "destructive" });
      return;
    }
    setLoading(true);
    if (saved) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("helper_user_id", helperUserId);
      setSaved(false);
    } else {
      await supabase
        .from("bookmarks")
        .insert({ user_id: user.id, helper_user_id: helperUserId });
      setSaved(true);
      toast({ title: "Helper saved!" });
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm transition-colors hover:bg-background ${className}`}
      aria-label={saved ? "Remove from saved" : "Save helper"}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${saved ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
      />
    </button>
  );
};

export default SaveHelperButton;
