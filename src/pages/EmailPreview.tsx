import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

interface RenderedTemplate {
  templateName: string;
  displayName?: string;
  subject: string;
  html: string;
  status: string;
  errorMessage?: string;
}

interface IncompleteHelper {
  user_id: string;
  email: string;
  full_name: string;
  first_name: string;
  city: string | null;
  skills_count: number;
  current_step: number;
  next_step: number | null;
  last_reminder_sent_at: string | null;
  unsubscribed: boolean;
  signup_at: string | null;
  missing: string[];
}

const TEMPLATE_NAMES = [
  "helper-reminder-1-friendly",
  "helper-reminder-2-urgency",
  "helper-reminder-3-final",
];

const STEP_LABELS: Record<number, string> = {
  1: "Friendly",
  2: "Urgency",
  3: "Final",
};

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

  const [helpers, setHelpers] = useState<IncompleteHelper[]>([]);
  const [loadingHelpers, setLoadingHelpers] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

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

  const loadHelpers = async () => {
    setLoadingHelpers(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-helper-reminders",
        { body: { action: "list" } }
      );
      if (error) throw error;
      setHelpers(data?.helpers || []);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoadingHelpers(false);
    }
  };

  const toggleAll = () => {
    const eligible = helpers.filter(
      (h) => !h.unsubscribed && h.next_step !== null
    );
    if (selected.size === eligible.length && eligible.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map((h) => h.user_id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const sendToSelected = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one helper");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-helper-reminders",
        { body: { action: "send", user_ids: Array.from(selected) } }
      );
      if (error) throw error;
      toast.success(
        `Sent ${data?.sent ?? 0}, skipped ${data?.skipped ?? 0}`
      );
      if (data?.errors?.length) {
        console.warn("Reminder send errors:", data.errors);
      }
      await loadHelpers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (loading) return null;
  if (!user) return embedded ? null : <Navigate to="/auth" replace />;
  if (!embedded && isAdmin === false) return <Navigate to="/" replace />;
  if (isAdmin === null) return null;

  const eligibleCount = helpers.filter(
    (h) => !h.unsubscribed && h.next_step !== null
  ).length;

  return (
    <div className={embedded ? "space-y-6" : "container mx-auto max-w-6xl py-8 px-4 space-y-6"}>
      <div>
        <h1 className="text-3xl font-bold">Helper Reminder Emails</h1>
        <p className="text-muted-foreground mt-1">
          Preview templates and send reminders to helpers whose profiles are
          incomplete (missing skills or city) and therefore don't appear in
          search.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview Variables</CardTitle>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Incomplete helpers (not in search)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              These helpers don't show up in search because they're missing
              skills or city. Bulk-send sends each helper their next reminder
              step (cap of 3 emails total). Time delays are bypassed; the cap
              and unsubscribes are still respected.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadHelpers} disabled={loadingHelpers}>
              {loadingHelpers ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Load helpers
            </Button>
            <Button
              onClick={sendToSelected}
              disabled={sending || selected.size === 0}
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send to {selected.size} selected
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {helpers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {loadingHelpers
                ? "Loading…"
                : 'Click "Load helpers" to fetch incomplete helper profiles.'}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={
                    eligibleCount > 0 && selected.size === eligibleCount
                  }
                  onCheckedChange={toggleAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="cursor-pointer">
                  Select all eligible ({eligibleCount} of {helpers.length})
                </label>
              </div>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Missing</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Next</TableHead>
                      <TableHead>Last sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {helpers.map((h) => {
                      const eligible = !h.unsubscribed && h.next_step !== null;
                      return (
                        <TableRow key={h.user_id}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(h.user_id)}
                              onCheckedChange={() => toggleOne(h.user_id)}
                              disabled={!eligible}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {h.full_name || "—"}
                          </TableCell>
                          <TableCell className="text-xs">{h.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {h.missing.map((m) => (
                                <Badge key={m} variant="outline" className="text-xs">
                                  {m}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {h.current_step}/3
                          </TableCell>
                          <TableCell className="text-xs">
                            {h.unsubscribed ? (
                              <Badge variant="destructive">unsub</Badge>
                            ) : h.next_step === null ? (
                              <Badge variant="secondary">max</Badge>
                            ) : (
                              <Badge>{STEP_LABELS[h.next_step]}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {h.last_reminder_sent_at
                              ? new Date(h.last_reminder_sent_at).toLocaleDateString()
                              : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
