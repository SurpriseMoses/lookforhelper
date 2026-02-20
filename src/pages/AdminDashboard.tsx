import { useEffect, useState } from "react";
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
import { Shield, Flag, UserCheck, Ban, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";

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

  useEffect(() => {
    if (role === "admin") {
      loadReports();
      loadUsers();
    }
  }, [role]);

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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
