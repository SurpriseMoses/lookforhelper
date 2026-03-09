import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, FileDown } from "lucide-react";

const DataExportCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);

    try {
      // Fetch all user data in parallel
      const [profileRes, helperRes, messagesRes, hiresRes, reviewsRes, bookmarksRes, notificationsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("helper_details").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("messages").select("content, created_at, conversation_id").eq("sender_id", user.id),
        supabase.from("hires").select("*").or(`helper_id.eq.${user.id},seeker_id.eq.${user.id}`),
        supabase.from("helper_reviews").select("*").or(`helper_id.eq.${user.id},seeker_id.eq.${user.id}`),
        supabase.from("bookmarks").select("*").eq("user_id", user.id),
        supabase.from("notifications").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        profile: profileRes.data,
        helper_details: helperRes.data,
        messages_sent: messagesRes.data ?? [],
        hires: hiresRes.data ?? [],
        reviews: reviewsRes.data ?? [],
        bookmarks: bookmarksRes.data ?? [],
        notifications: notificationsRes.data ?? [],
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lookforhelper-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Data exported successfully" });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileDown className="h-5 w-5" /> Download My Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Download all your personal data in JSON format. This includes your profile, messages, hires, reviews, and bookmarks.
        </p>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting..." : "Export My Data"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DataExportCard;
