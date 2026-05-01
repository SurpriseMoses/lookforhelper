import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Mail, Send, RefreshCw, Users } from "lucide-react";
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

const STEP_LABELS: Record<number, string> = {
  1: "Friendly",
  2: "Urgency",
  3: "Final",
};

// Known templates registered in the transactional registry.
const KNOWN_TEMPLATES = [
  "helper-reminder-1-friendly",
  "helper-reminder-2-urgency",
  "helper-reminder-3-final",
];

export default function AdminEmailPreview() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<RenderedTemplate[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("Thandi");
  const [profileLink, setProfileLink] = useState(
    "https://lookforhelper.co.za/dashboard"
  );
  const [testEmail, setTestEmail] = useState(user?.email ?? "");
  const [sending, setSending] = useState(false);

  const [helpers, setHelpers] = useState<IncompleteHelper[]>([]);
  const [loadingHelpers, setLoadingHelpers] = useState(false);
  const [selectedHelpers, setSelectedHelpers] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);

  const loadHelpers = async () => {
    setLoadingHelpers(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-helper-reminders",
        { body: { action: "list" } }
      );
      if (error) throw error;
      setHelpers(data?.helpers || []);
      setSelectedHelpers(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load helpers");
    } finally {
      setLoadingHelpers(false);
    }
  };

  const eligibleHelpers = useMemo(
    () => helpers.filter((h) => !h.unsubscribed && h.next_step !== null),
    [helpers]
  );

  const toggleAll = () => {
    if (selectedHelpers.size === eligibleHelpers.length && eligibleHelpers.length > 0) {
      setSelectedHelpers(new Set());
    } else {
      setSelectedHelpers(new Set(eligibleHelpers.map((h) => h.user_id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedHelpers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedHelpers(next);
  };

  const sendToSelected = async () => {
    if (selectedHelpers.size === 0) {
      toast.error("Select at least one helper");
      return;
    }
    setBulkSending(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-helper-reminders",
        { body: { action: "send", user_ids: Array.from(selectedHelpers) } }
      );
      if (error) throw error;
      toast.success(`Sent ${data?.sent ?? 0}, skipped ${data?.skipped ?? 0}`);
      if (data?.errors?.length) console.warn("Reminder send errors:", data.errors);
      await loadHelpers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setBulkSending(false);
    }
  };

  useEffect(() => {
    if (!testEmail && user?.email) setTestEmail(user.email);
  }, [user?.email]);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-preview-email",
        {
          body: {
            templateNames: KNOWN_TEMPLATES,
            templateData: { name, profile_link: profileLink },
          },
        }
      );
      if (error) throw error;
      const list: RenderedTemplate[] = data?.templates || [];
      setTemplates(list);
      if (list.length && !selectedName) setSelectedName(list[0].templateName);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to render");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
    loadHelpers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => templates.find((t) => t.templateName === selectedName) ?? templates[0],
    [templates, selectedName]
  );

  const sendTest = async () => {
    if (!selected) return;
    if (!testEmail || !/^\S+@\S+\.\S+$/.test(testEmail)) {
      toast.error("Enter a valid recipient email");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("admin-preview-email", {
        body: {
          action: "sendTest",
          templateName: selected.templateName,
          recipientEmail: testEmail,
          templateData: { name, profile_link: profileLink },
        },
      });
      if (error) throw error;
      toast.success(`Test email queued to ${testEmail}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send test");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ep-name" className="text-xs">{"{{name}}"}</Label>
              <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-link" className="text-xs">{"{{profile_link}}"}</Label>
              <Input id="ep-link" value={profileLink} onChange={(e) => setProfileLink(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-test" className="text-xs">Send test to</Label>
              <Input
                id="ep-test"
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh previews
            </Button>
            <Button size="sm" onClick={sendTest} disabled={sending || !selected}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send test email
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        {/* Templates list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Templates ({templates.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {templates.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">
                {loading ? "Loading…" : "No templates."}
              </p>
            ) : (
              <ul className="space-y-1">
                {templates.map((t) => {
                  const active = t.templateName === selected?.templateName;
                  return (
                    <li key={t.templateName}>
                      <button
                        onClick={() => setSelectedName(t.templateName)}
                        className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                          active
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "hover:bg-muted border border-transparent"
                        }`}
                      >
                        <div className="font-medium truncate">
                          {t.displayName || t.templateName}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <Badge
                            variant={t.status === "ready" ? "secondary" : "destructive"}
                            className="text-[10px]"
                          >
                            {t.status}
                          </Badge>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Preview panel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {selected ? (
                <>
                  Subject:{" "}
                  <span className="font-normal text-muted-foreground">
                    {selected.subject || "—"}
                  </span>
                </>
              ) : (
                "Preview"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground">Select a template to preview.</p>
            ) : selected.status === "ready" ? (
              <iframe
                title={selected.templateName}
                srcDoc={selected.html}
                className="w-full h-[600px] border rounded-md bg-white"
              />
            ) : (
              <div className="text-destructive text-sm">
                {selected.status}: {selected.errorMessage}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Incomplete Helpers
            <Badge variant="secondary" className="ml-2">{helpers.length}</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Helpers missing skills or city — they don't appear in search. Select and send the next reminder step.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={loadHelpers} disabled={loadingHelpers}>
              {loadingHelpers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh list
            </Button>
            <Button size="sm" variant="outline" onClick={toggleAll} disabled={eligibleHelpers.length === 0}>
              {selectedHelpers.size === eligibleHelpers.length && eligibleHelpers.length > 0
                ? "Deselect all"
                : `Select all eligible (${eligibleHelpers.length})`}
            </Button>
            <Button size="sm" onClick={sendToSelected} disabled={bulkSending || selectedHelpers.size === 0}>
              {bulkSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send next reminder ({selectedHelpers.size})
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Missing</TableHead>
                  <TableHead>Last step</TableHead>
                  <TableHead>Next</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingHelpers && helpers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : helpers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      No incomplete helpers 🎉
                    </TableCell>
                  </TableRow>
                ) : (
                  helpers.map((h) => {
                    const eligible = !h.unsubscribed && h.next_step !== null;
                    return (
                      <TableRow key={h.user_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedHelpers.has(h.user_id)}
                            disabled={!eligible}
                            onCheckedChange={() => toggleOne(h.user_id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{h.full_name || "—"}</TableCell>
                        <TableCell className="text-xs">{h.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {h.missing.map((m) => (
                              <Badge key={m} variant="destructive" className="text-[10px]">{m}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {h.current_step > 0 ? STEP_LABELS[h.current_step] : "None"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {h.next_step ? STEP_LABELS[h.next_step] : "Max"}
                        </TableCell>
                        <TableCell>
                          {h.unsubscribed ? (
                            <Badge variant="outline" className="text-[10px]">Unsubscribed</Badge>
                          ) : eligible ? (
                            <Badge variant="secondary" className="text-[10px]">Eligible</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Done</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
