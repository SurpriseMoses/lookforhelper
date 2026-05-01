import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Mail,
  Send,
  RefreshCw,
  Users,
  ExternalLink,
  Smartphone,
  Monitor,
  Zap,
  CheckCircle2,
  Clock,
  Inbox,
} from "lucide-react";
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
  country: string | null;
  years_experience: number | null;
  skills: string[];
  skills_count: number;
  current_step: number;
  next_step: number | null;
  last_reminder_sent_at: string | null;
  unsubscribed: boolean;
  signup_at: string | null;
  missing: string[];
}

interface Insights {
  total_helpers: number;
  eligible_now: number;
  sent_today: number;
  sent_last_7_days: number;
  completions_last_7_days: number;
}

const STEP_LABELS: Record<number, string> = {
  1: "Friendly",
  2: "Urgency",
  3: "Final",
};

const KNOWN_TEMPLATES = [
  "helper-reminder-1-friendly",
  "helper-reminder-2-urgency",
  "helper-reminder-3-final",
];

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

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
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const [helpers, setHelpers] = useState<IncompleteHelper[]>([]);
  const [loadingHelpers, setLoadingHelpers] = useState(false);
  const [selectedHelpers, setSelectedHelpers] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);

  const [insights, setInsights] = useState<Insights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [automationOn, setAutomationOn] = useState<boolean>(true);
  const [togglingAutomation, setTogglingAutomation] = useState(false);
  const [batchSending, setBatchSending] = useState(false);

  // ---- Loaders ----
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

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-helper-reminders",
        { body: { action: "insights" } }
      );
      if (error) throw error;
      setInsights(data?.insights ?? null);
    } catch (err) {
      console.warn("Failed to load insights:", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-helper-reminders",
        { body: { action: "get_settings" } }
      );
      if (error) throw error;
      setAutomationOn(data?.settings?.helper_reminders_enabled ?? true);
    } catch (err) {
      console.warn("Failed to load settings:", err);
    }
  };

  // ---- Selection ----
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

  // ---- Actions ----
  const sendToSelected = async () => {
    if (selectedHelpers.size === 0) {
      toast.error("Select at least one helper to send to");
      return;
    }
    setBulkSending(true);
    const t = toast.loading(`Sending ${selectedHelpers.size} reminder(s)…`);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-helper-reminders",
        { body: { action: "send", user_ids: Array.from(selectedHelpers) } }
      );
      if (error) throw error;
      toast.success(
        `✓ Sent ${data?.sent ?? 0} • Skipped ${data?.skipped ?? 0}`,
        { id: t }
      );
      if (data?.errors?.length) console.warn("Reminder send errors:", data.errors);
      await Promise.all([loadHelpers(), loadInsights()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send", { id: t });
    } finally {
      setBulkSending(false);
    }
  };

  const sendBatchNow = async () => {
    if (eligibleHelpers.length === 0) {
      toast.error("No eligible helpers to send to right now");
      return;
    }
    if (
      !confirm(
        `Send next reminder to all ${eligibleHelpers.length} eligible helpers now?`
      )
    )
      return;
    setBatchSending(true);
    const t = toast.loading(`Sending batch to ${eligibleHelpers.length}…`);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-helper-reminders",
        { body: { action: "send_batch" } }
      );
      if (error) throw error;
      toast.success(
        `✓ Batch complete — Sent ${data?.sent ?? 0} • Skipped ${data?.skipped ?? 0}`,
        { id: t }
      );
      await Promise.all([loadHelpers(), loadInsights()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Batch failed", { id: t });
    } finally {
      setBatchSending(false);
    }
  };

  const toggleAutomation = async (enabled: boolean) => {
    setTogglingAutomation(true);
    try {
      const { error } = await supabase.functions.invoke(
        "admin-helper-reminders",
        { body: { action: "toggle_automation", enabled } }
      );
      if (error) throw error;
      setAutomationOn(enabled);
      toast.success(
        enabled
          ? "Automation enabled — daily reminders will resume"
          : "Automation paused — daily reminders won't send"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    } finally {
      setTogglingAutomation(false);
    }
  };

  // ---- Preview ----
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
    loadInsights();
    loadSettings();
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
    const t = toast.loading(`Sending test to ${testEmail}…`);
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
      toast.success(`✓ Test email queued to ${testEmail}`, { id: t });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send test", {
        id: t,
      });
    } finally {
      setSending(false);
    }
  };

  // Wrapper that shows tooltip when a button is disabled, with the reason.
  const DisabledHint = ({
    disabled,
    reason,
    children,
  }: {
    disabled: boolean;
    reason?: string;
    children: React.ReactNode;
  }) => {
    if (!disabled || !reason) return <>{children}</>;
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">{children}</span>
          </TooltipTrigger>
          <TooltipContent>{reason}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-4">
      {/* Email System Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" /> Email System Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap rounded-md border p-3">
            <div>
              <div className="font-medium text-sm">Daily reminder automation</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                When on, the daily cron sends the next reminder to eligible
                helpers. When off, no automated emails are sent.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {togglingAutomation && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Badge variant={automationOn ? "default" : "secondary"}>
                {automationOn ? "ON" : "PAUSED"}
              </Badge>
              <Switch
                checked={automationOn}
                onCheckedChange={toggleAutomation}
                disabled={togglingAutomation}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DisabledHint
              disabled={eligibleHelpers.length === 0}
              reason="No eligible helpers right now — load the list to refresh"
            >
              <Button
                size="sm"
                onClick={sendBatchNow}
                disabled={batchSending || eligibleHelpers.length === 0}
              >
                {batchSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send batch now ({eligibleHelpers.length})
              </Button>
            </DisabledHint>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                loadInsights();
                loadHelpers();
              }}
              disabled={loadingInsights || loadingHelpers}
            >
              {loadingInsights || loadingHelpers ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh data
            </Button>
            <span className="text-xs text-muted-foreground">
              {eligibleHelpers.length} eligible • {helpers.length} incomplete total
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="h-4 w-4" /> Email Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <StatTile
              icon={Users}
              label="Eligible now"
              value={insights?.eligible_now ?? "—"}
              hint="Will receive a reminder"
            />
            <StatTile
              icon={Clock}
              label="Sent today"
              value={insights?.sent_today ?? "—"}
              hint="Reminders dispatched today"
            />
            <StatTile
              icon={Send}
              label="Sent (7 days)"
              value={insights?.sent_last_7_days ?? "—"}
              hint="Confirmed deliveries"
            />
            <StatTile
              icon={CheckCircle2}
              label="Completions (7d)"
              value={insights?.completions_last_7_days ?? "—"}
              hint="Profiles completed"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview controls */}
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
          <div className="flex gap-2 flex-wrap items-center">
            <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh previews
            </Button>
            <DisabledHint
              disabled={!selected || !testEmail}
              reason={!selected ? "Pick a template first" : "Enter a recipient email"}
            >
              <Button size="sm" onClick={sendTest} disabled={sending || !selected || !testEmail}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send test email
              </Button>
            </DisabledHint>

            <div className="ml-auto flex items-center gap-1 rounded-md border p-0.5">
              <Button
                type="button"
                size="sm"
                variant={previewMode === "desktop" ? "secondary" : "ghost"}
                className="h-7 px-2"
                onClick={() => setPreviewMode("desktop")}
              >
                <Monitor className="h-3.5 w-3.5 mr-1" /> Desktop
              </Button>
              <Button
                type="button"
                size="sm"
                variant={previewMode === "mobile" ? "secondary" : "ghost"}
                className="h-7 px-2"
                onClick={() => setPreviewMode("mobile")}
              >
                <Smartphone className="h-3.5 w-3.5 mr-1" /> Mobile
              </Button>
            </div>
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
              <div className="flex justify-center">
                <iframe
                  title={selected.templateName}
                  srcDoc={selected.html}
                  className="border rounded-md bg-white transition-all"
                  style={{
                    width: previewMode === "mobile" ? 390 : "100%",
                    maxWidth: "100%",
                    height: 600,
                  }}
                />
              </div>
            ) : (
              <div className="text-destructive text-sm">
                {selected.status}: {selected.errorMessage}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Helpers table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Incomplete Helpers
            <Badge variant="secondary" className="ml-2">{helpers.length}</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Helpers missing skills or city — they don't appear in search.
            Select and send the next reminder step.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={loadHelpers} disabled={loadingHelpers}>
              {loadingHelpers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh list
            </Button>
            <DisabledHint
              disabled={eligibleHelpers.length === 0}
              reason="No eligible helpers — everyone is unsubscribed or has reached the 3-email cap"
            >
              <Button
                size="sm"
                variant="outline"
                onClick={toggleAll}
                disabled={eligibleHelpers.length === 0}
              >
                {selectedHelpers.size === eligibleHelpers.length && eligibleHelpers.length > 0
                  ? "Deselect all"
                  : `Select all eligible (${eligibleHelpers.length})`}
              </Button>
            </DisabledHint>
            <DisabledHint
              disabled={selectedHelpers.size === 0}
              reason="Select at least one helper using the checkboxes"
            >
              <Button size="sm" onClick={sendToSelected} disabled={bulkSending || selectedHelpers.size === 0}>
                {bulkSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send next reminder ({selectedHelpers.size})
              </Button>
            </DisabledHint>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Exp</TableHead>
                  <TableHead>Missing</TableHead>
                  <TableHead>Next</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingHelpers && helpers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-6">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : helpers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="font-medium">All helpers are search-ready 🎉</div>
                      <div className="text-xs mt-1">
                        Every helper has at least one skill and a city. Check
                        back after new signups.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  helpers.map((h) => {
                    const eligible = !h.unsubscribed && h.next_step !== null;
                    const skillsLabel = h.skills_count > 0
                      ? `${h.skills_count} (${h.skills.slice(0, 2).join(", ")}${h.skills_count > 2 ? "…" : ""})`
                      : "—";
                    const location = [h.city, h.country].filter(Boolean).join(", ") || "—";
                    return (
                      <TableRow key={h.user_id}>
                        <TableCell>
                          <DisabledHint
                            disabled={!eligible}
                            reason={
                              h.unsubscribed
                                ? "Helper has unsubscribed"
                                : "All 3 reminders already sent"
                            }
                          >
                            <Checkbox
                              checked={selectedHelpers.has(h.user_id)}
                              disabled={!eligible}
                              onCheckedChange={() => toggleOne(h.user_id)}
                            />
                          </DisabledHint>
                        </TableCell>
                        <TableCell className="font-medium">{h.full_name || "—"}</TableCell>
                        <TableCell className="text-xs">{h.email}</TableCell>
                        <TableCell className="text-xs">{skillsLabel}</TableCell>
                        <TableCell className="text-xs">{location}</TableCell>
                        <TableCell className="text-xs">
                          {h.years_experience != null ? `${h.years_experience}y` : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {h.missing.map((m) => (
                              <Badge key={m} variant="destructive" className="text-[10px]">{m}</Badge>
                            ))}
                          </div>
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
                        <TableCell className="text-right">
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                          >
                            <a
                              href={`/helper/${h.user_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              View
                            </a>
                          </Button>
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
