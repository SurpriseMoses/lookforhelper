import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RenderedTemplate {
  templateName: string;
  displayName?: string;
  subject: string;
  html: string;
  status: string;
  errorMessage?: string;
}

const TEMPLATE_NAMES = [
  "helper-reminder-1-friendly",
  "helper-reminder-2-urgency",
  "helper-reminder-3-final",
];

interface EmailPreviewProps {
  embedded?: boolean;
}

export default function EmailPreview({ embedded = false }: EmailPreviewProps) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [name, setName] = useState("Thandi");
  const [profileLink, setProfileLink] = useState(
    "https://lookforhelper.co.za/dashboard"
  );
  const [templates, setTemplates] = useState<RenderedTemplate[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (embedded) {
      setIsAdmin(true);
      return;
    }

    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [embedded, user]);

  const generate = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-preview-email",
        {
          body: {
            templateNames: TEMPLATE_NAMES,
            templateData: { name, profile_link: profileLink },
          },
        }
      );
      if (error) throw error;
      setTemplates(data?.templates || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to render");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;
  if (!user) return embedded ? null : <Navigate to="/auth" replace />;
  if (!embedded && isAdmin === false) return <Navigate to="/" replace />;
  if (isAdmin === null) return null;

  return (
    <div className={embedded ? "space-y-6" : "container mx-auto max-w-6xl py-8 px-4 space-y-6"}>
      <div>
        <h1 className="text-3xl font-bold">Helper Reminder Email Preview</h1>
        <p className="text-muted-foreground mt-1">
          Render the three reminder templates with custom variables.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{"{{name}}"}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">{"{{profile_link}}"}</Label>
              <Input
                id="link"
                value={profileLink}
                onChange={(e) => setProfileLink(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={generate} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate previews
          </Button>
        </CardContent>
      </Card>

      {templates.length > 0 && (
        <Tabs defaultValue={templates[0].templateName}>
          <TabsList className="w-full justify-start flex-wrap h-auto">
            {templates.map((t) => (
              <TabsTrigger key={t.templateName} value={t.templateName}>
                {t.displayName || t.templateName}
              </TabsTrigger>
            ))}
          </TabsList>
          {templates.map((t) => (
            <TabsContent key={t.templateName} value={t.templateName}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Subject: <span className="font-normal">{t.subject}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {t.status === "ready" ? (
                    <iframe
                      title={t.templateName}
                      srcDoc={t.html}
                      className="w-full h-[700px] border rounded-md bg-white"
                    />
                  ) : (
                    <div className="text-destructive text-sm">
                      {t.status}: {t.errorMessage}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
