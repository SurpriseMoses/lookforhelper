import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Flag, UserCheck, Ban, CheckCircle, XCircle, Eye, ShieldCheck, FileText, Star, MessageSquare, Gift, Search, Briefcase, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

interface VerificationReq {
  id: string;
  user_id: string;
  document_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  helper_name: string;
  document_type: string | null;
  selfie_url: string | null;
  country_of_origin: string | null;
  document_number: string | null;
  expiry_date: string | null;
}

interface Report {
  id: string;
  reporter_user_id: string;
  reported_user_id: string;
  reason: string;
  details: string | null;
  context_type: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reporter_name: string;
  reported_name: string;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  is_suspended: boolean;
  suspended_reason: string | null;
  is_verified: boolean;
  role: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  reviewing: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  dismissed: "bg-muted text-muted-foreground",
};

const AdminDashboard = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [suspendReason, setSuspendReason] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationRequests, setVerificationRequests] = useState<VerificationReq[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [featuredStats, setFeaturedStats] = useState({ total: 0, active: 0, expired: 0, revenue: 0 });
  const [seekerSubStats, setSeekerSubStats] = useState({ total: 0, active: 0, expired: 0, revenue: 0 });
  const [referralStats, setReferralStats] = useState({ total: 0, pending: 0, completed: 0, rewarded: 0 });
  const [bgCheckStats, setBgCheckStats] = useState({ requested: 0 });
  const [hireStats, setHireStats] = useState({ total: 0, confirmed: 0, pending: 0 });
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (role === "admin") {
      loadReports();
      loadUsers();
      loadVerificationRequests();
      loadFeaturedStats();
      loadSeekerSubStats();
      loadReferralStats();
      loadBgCheckStats();
      loadHireStats();
    }
  }, [role]);

  const loadFeaturedStats = async () => {
    const { data: payments } = await supabase
      .from("featured_payments")
      .select("status, amount");

    const paidPayments = (payments ?? []).filter((p: any) => p.status === "paid");
    const totalRevenue = paidPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const { data: helpers } = await supabase
      .from("helper_details")
      .select("is_featured, featured_until, featured_status")
      .neq("featured_status", "none");

    const now = new Date();
    const allFeatured = helpers ?? [];
    const active = allFeatured.filter((h: any) => h.is_featured && h.featured_until && new Date(h.featured_until) > now);
    const expired = allFeatured.filter((h: any) => !h.is_featured || (h.featured_until && new Date(h.featured_until) <= now));

    setFeaturedStats({
      total: allFeatured.length,
      active: active.length,
      expired: expired.length,
      revenue: totalRevenue,
    });
  };

  const loadSeekerSubStats = async () => {
    const { data: subs } = await supabase
      .from("seeker_subscriptions")
      .select("status, amount, current_period_end");

    const all = subs ?? [];
    const now = new Date();
    const activeSubs = all.filter((s: any) => s.status === "active" && s.current_period_end && new Date(s.current_period_end) > now);
    const expiredSubs = all.filter((s: any) => s.status === "expired" || (s.status === "active" && s.current_period_end && new Date(s.current_period_end) <= now));
    const totalRevenue = all.filter((s: any) => s.status === "active" || s.status === "expired").reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);

    setSeekerSubStats({
      total: all.filter((s: any) => s.status !== "free").length,
      active: activeSubs.length,
      expired: expiredSubs.length,
      revenue: totalRevenue,
    });
  };

  const loadReferralStats = async () => {
    const { data } = await supabase
      .from("referrals")
      .select("status, reward_given");

    const all = data ?? [];
    setReferralStats({
      total: all.length,
      pending: all.filter((r: any) => r.status === "pending").length,
      completed: all.filter((r: any) => r.status === "completed").length,
      rewarded: all.filter((r: any) => r.reward_given).length,
    });
  };

  const loadHireStats = async () => {
    const { data } = await supabase.from("hires").select("status");
    const all = data ?? [];
    setHireStats({
      total: all.length,
      confirmed: all.filter((h: any) => h.status === "confirmed").length,
      pending: all.filter((h: any) => h.status === "pending").length,
    });
  };

  const loadBgCheckStats = async () => {
    const { data } = await supabase
      .from("helper_details")
      .select("background_check_requested");
    const requested = (data ?? []).filter((d: any) => d.background_check_requested === true);
    setBgCheckStats({ requested: requested.length });
  };

  const loadVerificationRequests = async () => {
    const { data } = await supabase
      .from("verification_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setVerificationRequests([]);
      return;
    }

    const userIds = [...new Set(data.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

    setVerificationRequests(
      data.map((r) => ({
        ...r,
        helper_name: nameMap.get(r.user_id) ?? "Unknown",
      }))
    );
  };

  const loadReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setReports([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.flatMap((r) => [r.reporter_user_id, r.reported_user_id]))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

    setReports(
      data.map((r) => ({
        ...r,
        reporter_name: nameMap.get(r.reporter_user_id) ?? "Unknown",
        reported_name: nameMap.get(r.reported_user_id) ?? "Unknown",
      }))
    );
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, is_suspended, suspended_reason, is_verified")
      .order("full_name");

    if (!profiles) return;

    const userIds = profiles.map((p) => p.user_id);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));

    setUsers(
      profiles.map((p) => ({
        ...p,
        role: roleMap.get(p.user_id) ?? "unknown",
      }))
    );
  };

  const handleUpdateReport = async (reportId: string, status: string) => {
    const { error } = await supabase
      .from("reports")
      .update({
        status,
        admin_notes: adminNotes[reportId] || null,
        resolved_by: user?.id,
      })
      .eq("id", reportId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Report ${status}` });
      loadReports();
    }
  };

  const handleToggleSuspend = async (userId: string, currentlySuspended: boolean) => {
    const update = currentlySuspended
      ? { is_suspended: false, suspended_at: null, suspended_reason: null }
      : {
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_reason: suspendReason[userId] || "Violated community guidelines",
        };

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentlySuspended ? "User unsuspended" : "User suspended" });
      loadUsers();
    }
  };

  const handleToggleVerify = async (userId: string, currentlyVerified: boolean) => {
    const update = currentlyVerified
      ? { is_verified: false, verified_at: null }
      : { is_verified: true, verified_at: new Date().toISOString() };

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentlyVerified ? "Verification removed" : "User verified" });
      loadUsers();
    }
  };

  const handleApproveVerification = async (reqId: string, userId: string) => {
    const { error: reqError } = await supabase
      .from("verification_requests")
      .update({ status: "approved", reviewed_by: user?.id })
      .eq("id", reqId);

    if (reqError) {
      toast({ title: "Error", description: reqError.message, variant: "destructive" });
      return;
    }

    // Don't set is_verified here — helper must pay R49 first to complete verification
    toast({ title: "Document approved! Helper will be prompted to pay R49 to complete verification." });
    loadVerificationRequests();
  };

  const handleRejectVerification = async (reqId: string, reason?: string) => {
    const rejectReason = reason || rejectionReasons[reqId];
    if (!rejectReason) {
      toast({ title: "Please provide a rejection reason", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("verification_requests")
      .update({ status: "rejected", rejection_reason: rejectReason, reviewed_by: user?.id } as any)
      .eq("id", reqId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verification rejected" });
      loadVerificationRequests();
    }
  };

  const handleRequestNewUpload = async (reqId: string) => {
    await handleRejectVerification(reqId, "Please upload clearer or valid documents.");
  };

  const handleViewSelfie = async (selfiePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("verification-selfies")
        .download(selfiePath);
      if (error || !data) {
        toast({ title: "Error", description: error?.message || "Could not load selfie", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const [docPreviewDataUrl, setDocPreviewDataUrl] = useState<string | null>(null);
  const [docPreviewBlobUrl, setDocPreviewBlobUrl] = useState<string | null>(null);
  const [docPreviewName, setDocPreviewName] = useState("");
  const [docPreviewLoading, setDocPreviewLoading] = useState(false);
  const [docPreviewType, setDocPreviewType] = useState<string>("");
  const [docPreviewPdfError, setDocPreviewPdfError] = useState<string | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleViewDocument = async (documentPath: string) => {
    setDocPreviewLoading(true);
    setDocPreviewPdfError(null);
    const fileName = documentPath.split("/").pop() || "document";
    setDocPreviewName(fileName);
    try {
      const { data, error } = await supabase.storage
        .from("identity-documents")
        .download(documentPath);

      if (error || !data) {
        console.error("Download error:", error);
        toast({
          title: "Error viewing document",
          description: error?.message || "Could not download the document.",
          variant: "destructive",
        });
        setDocPreviewLoading(false);
        return;
      }

      const mimeType = data.type || "application/octet-stream";
      setDocPreviewType(mimeType);

      const blobUrl = URL.createObjectURL(data);
      setDocPreviewBlobUrl(blobUrl);

      if (mimeType.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocPreviewDataUrl(reader.result as string);
        };
        reader.readAsDataURL(data);
      } else {
        setDocPreviewDataUrl(null);
      }
    } catch (err: any) {
      console.error("Document view error:", err);
      toast({
        title: "Error viewing document",
        description: err?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setDocPreviewLoading(false);
    }
  };

  useEffect(() => {
    const renderPdfPreview = async () => {
      if (!docPreviewBlobUrl || !docPreviewType.includes("pdf") || !pdfCanvasRef.current) return;

      try {
        GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const pdf = await getDocument(docPreviewBlobUrl).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = pdfCanvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) {
          setDocPreviewPdfError("Canvas rendering is not available in this browser.");
          return;
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;
        setDocPreviewPdfError(null);
      } catch (error: any) {
        console.error("PDF render error:", error);
        setDocPreviewPdfError("Could not render this PDF preview.");
      }
    };

    renderPdfPreview();
  }, [docPreviewBlobUrl, docPreviewType]);

  const handleCloseDocPreview = () => {
    if (docPreviewBlobUrl) {
      URL.revokeObjectURL(docPreviewBlobUrl);
    }
    setDocPreviewDataUrl(null);
    setDocPreviewBlobUrl(null);
    setDocPreviewName("");
    setDocPreviewType("");
    setDocPreviewPdfError(null);
  };

  const handleDownloadDoc = () => {
    if (!docPreviewBlobUrl) return;
    const link = document.createElement("a");
    link.href = docPreviewBlobUrl;
    link.download = docPreviewName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
          <Button asChild className="mt-4">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const pendingReports = reports.filter((r) => r.status === "pending" || r.status === "reviewing");
  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{pendingReports.length}</p>
              <p className="text-xs text-muted-foreground">Pending Reports</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{users.filter((u) => u.is_suspended).length}</p>
              <p className="text-xs text-muted-foreground">Suspended Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{users.filter((u) => u.is_verified).length}</p>
              <p className="text-xs text-muted-foreground">Verified Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reports">
          <TabsList className="mb-4">
            <TabsTrigger value="reports" className="gap-1.5">
              <Flag className="h-4 w-4" /> Reports {pendingReports.length > 0 && `(${pendingReports.length})`}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <UserCheck className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="verifications" className="gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Verifications {verificationRequests.filter(v => v.status === "pending").length > 0 && `(${verificationRequests.filter(v => v.status === "pending").length})`}
            </TabsTrigger>
            <TabsTrigger value="featured" className="gap-1.5">
              <Star className="h-4 w-4" /> Featured
            </TabsTrigger>
            <TabsTrigger value="seeker-plans" className="gap-1.5">
              <MessageSquare className="h-4 w-4" /> Seeker Plans
            </TabsTrigger>
            <TabsTrigger value="referrals" className="gap-1.5">
              <Gift className="h-4 w-4" /> Referrals
            </TabsTrigger>
            <TabsTrigger value="hires" className="gap-1.5">
              <Briefcase className="h-4 w-4" /> Hires
            </TabsTrigger>
            <TabsTrigger value="bg-checks" className="gap-1.5">
              <Search className="h-4 w-4" /> BG Checks
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports">
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Flag className="mx-auto h-8 w-8 mb-2 opacity-30" />
                No reports yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{report.reporter_name}</span>
                            <span className="text-xs text-muted-foreground">reported</span>
                            <span className="text-sm font-medium text-foreground">{report.reported_name}</span>
                          </div>
                          <p className="mt-1 text-sm text-foreground font-medium">{report.reason}</p>
                          {report.details && (
                            <p className="mt-1 text-sm text-muted-foreground">{report.details}</p>
                          )}
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{report.context_type}</Badge>
                            <span>{format(new Date(report.created_at), "MMM d, yyyy HH:mm")}</span>
                          </div>
                          {report.admin_notes && (
                            <p className="mt-2 text-sm text-muted-foreground italic">Admin: {report.admin_notes}</p>
                          )}
                        </div>
                        <Badge className={STATUS_COLORS[report.status] ?? ""}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                      </div>

                      {(report.status === "pending" || report.status === "reviewing") && (
                        <div className="mt-4 border-t pt-4 space-y-3">
                          <Textarea
                            placeholder="Admin notes..."
                            value={adminNotes[report.id] ?? ""}
                            onChange={(e) => setAdminNotes((prev) => ({ ...prev, [report.id]: e.target.value }))}
                            rows={2}
                          />
                          <div className="flex gap-2 flex-wrap">
                            {report.status === "pending" && (
                              <Button size="sm" variant="outline" onClick={() => handleUpdateReport(report.id, "reviewing")} className="gap-1">
                                <Eye className="h-4 w-4" /> Mark Reviewing
                              </Button>
                            )}
                            <Button size="sm" onClick={() => handleUpdateReport(report.id, "resolved")} className="gap-1">
                              <CheckCircle className="h-4 w-4" /> Resolve
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleUpdateReport(report.id, "dismissed")} className="gap-1">
                              <XCircle className="h-4 w-4" /> Dismiss
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="mb-4">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <Card key={u.user_id}>
                  <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-bold text-muted-foreground/50">
                          {u.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                        <Badge variant="outline" className="text-xs">{u.role}</Badge>
                        {u.is_verified && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs gap-1">
                            <CheckCircle className="h-3 w-3" /> Verified
                          </Badge>
                        )}
                        {u.is_suspended && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <Ban className="h-3 w-3" /> Suspended
                          </Badge>
                        )}
                      </div>
                      {u.suspended_reason && (
                        <p className="text-xs text-muted-foreground mt-0.5">Reason: {u.suspended_reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {!u.is_suspended ? (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Reason..."
                            className="h-8 w-36 text-xs"
                            value={suspendReason[u.user_id] ?? ""}
                            onChange={(e) => setSuspendReason((prev) => ({ ...prev, [u.user_id]: e.target.value }))}
                          />
                          <Button size="sm" variant="destructive" onClick={() => handleToggleSuspend(u.user_id, false)} className="gap-1">
                            <Ban className="h-3.5 w-3.5" /> Suspend
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleToggleSuspend(u.user_id, true)} className="gap-1">
                          Unsuspend
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={u.is_verified ? "ghost" : "outline"}
                        onClick={() => handleToggleVerify(u.user_id, u.is_verified)}
                        className="gap-1"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        {u.is_verified ? "Unverify" : "Verify"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          {/* Verifications Tab */}
          <TabsContent value="verifications">
            {verificationRequests.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <ShieldCheck className="mx-auto h-8 w-8 mb-2 opacity-30" />
                No verification requests yet.
              </div>
            ) : (
              <div className="space-y-4">
                {verificationRequests.map((vr) => (
                  <Card key={vr.id}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{vr.helper_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted {format(new Date(vr.created_at), "MMM d, yyyy HH:mm")}
                          </p>
                        </div>
                        <Badge className={STATUS_COLORS[vr.status] ?? ""}>
                          {vr.status.charAt(0).toUpperCase() + vr.status.slice(1)}
                        </Badge>
                      </div>

                      {/* Document viewer */}
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Identity Document</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(vr.document_url)}
                          className="gap-1"
                          disabled={docPreviewLoading}
                        >
                          <Eye className="h-4 w-4" /> {docPreviewLoading ? "Loading..." : "View Document"}
                        </Button>
                      </div>

                      {vr.rejection_reason && (
                        <p className="text-sm text-muted-foreground">Rejection reason: {vr.rejection_reason}</p>
                      )}

                      {vr.status === "pending" && (
                        <div className="border-t pt-3 space-y-3">
                          <Input
                            placeholder="Rejection reason (required to reject)..."
                            value={rejectionReasons[vr.id] ?? ""}
                            onChange={(e) => setRejectionReasons((prev) => ({ ...prev, [vr.id]: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApproveVerification(vr.id, vr.user_id)} className="gap-1">
                              <CheckCircle className="h-4 w-4" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectVerification(vr.id)} className="gap-1">
                              <XCircle className="h-4 w-4" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Featured Tab */}
          <TabsContent value="featured">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{featuredStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Featured</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{featuredStats.active}</p>
                  <p className="text-xs text-muted-foreground">Active Featured</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{featuredStats.expired}</p>
                  <p className="text-xs text-muted-foreground">Expired Featured</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">R{featuredStats.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Seeker Plans Tab */}
          <TabsContent value="seeker-plans">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{seekerSubStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Subscriptions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{seekerSubStats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{seekerSubStats.expired}</p>
                  <p className="text-xs text-muted-foreground">Expired</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">R{seekerSubStats.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{referralStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{referralStats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{referralStats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{referralStats.rewarded}</p>
                  <p className="text-xs text-muted-foreground">Rewards Issued</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Hires Tab */}
          <TabsContent value="hires">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{hireStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Hires</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{hireStats.confirmed}</p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{hireStats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Background Checks Tab */}
          <TabsContent value="bg-checks">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{bgCheckStats.requested}</p>
                  <p className="text-xs text-muted-foreground">Helpers Interested</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Feature Status</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">R149</p>
                  <p className="text-xs text-muted-foreground">Planned Price</p>
                </CardContent>
              </Card>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              This list shows helpers who clicked "Notify Me" and are interested in Background Checks when the feature launches.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!docPreviewBlobUrl} onOpenChange={(open) => { if (!open) handleCloseDocPreview(); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle className="flex items-center justify-between pr-8">
              <span className="truncate">{docPreviewName}</span>
              <Button size="sm" variant="outline" onClick={handleDownloadDoc} className="gap-1 ml-2 flex-shrink-0">
                <Download className="h-4 w-4" /> Download
              </Button>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Preview and download uploaded identity verification documents.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 px-6 pb-6">
            {docPreviewType.startsWith("image/") && docPreviewDataUrl ? (
              <img
                src={docPreviewDataUrl}
                alt="Document Preview"
                className="w-full h-full object-contain rounded-md border"
              />
            ) : docPreviewType.includes("pdf") ? (
              <div className="flex h-full items-center justify-center overflow-auto rounded-md border bg-muted/30 p-4">
                {docPreviewPdfError ? (
                  <p className="text-sm text-muted-foreground">{docPreviewPdfError}</p>
                ) : (
                  <canvas ref={pdfCanvasRef} className="max-w-full h-auto rounded-md bg-background shadow-sm" />
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                Preview unavailable for this file type. Please use download.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
