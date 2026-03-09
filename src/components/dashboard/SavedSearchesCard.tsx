import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Trash2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, any>;
  notify_new_matches: boolean;
  created_at: string;
}

const SavedSearchesCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadSearches();
  }, [user]);

  const loadSearches = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_searches" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSearches((data as any[]) ?? []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("saved_searches" as any)
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      setSearches((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const getFilterSummary = (filters: Record<string, any>) => {
    const parts: string[] = [];
    if (filters.cityFilter) parts.push(filters.cityFilter);
    if (filters.skillFilter && filters.skillFilter !== "all") parts.push(filters.skillFilter);
    if (filters.verifiedFilter) parts.push("Verified");
    return parts.length > 0 ? parts.join(" • ") : "All helpers";
  };

  if (loading || searches.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" /> Saved Searches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {searches.map((search) => (
          <div key={search.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{search.name}</p>
              <p className="text-xs text-muted-foreground">{getFilterSummary(search.filters)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {search.notify_new_matches && (
                <Badge variant="secondary" className="text-[10px]">
                  <Bell className="h-2.5 w-2.5 mr-0.5" /> Alerts on
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/browse`)}
                className="h-8 w-8 p-0"
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(search.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SavedSearchesCard;
