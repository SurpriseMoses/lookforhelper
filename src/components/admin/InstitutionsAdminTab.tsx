import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BadgeCheck, ShieldAlert, ShieldX, FileText } from "lucide-react";

const InstitutionsAdminTab = () => {
  const { toast } = useToast();
  const [insts, setInsts] = useState<any[]>([]);
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from("institutions").select("*").order("created_at", { ascending: false });
    setInsts(data || []);
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.from("institutions").update({ verification_status: "verified", verified_at: new Date().toISOString(), rejection_reason: null }).eq("id", id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Institution verified" }); load(); }
  };
  const reject = async (id: string) => {
    const reason = rejectionReason[id]?.trim();
    if (!reason) { toast({ title: "Reason required", variant: "destructive" }); return; }
    const { error } = await supabase.from("institutions").update({ verification_status: "rejected", rejection_reason: reason }).eq("id", id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Rejected" }); load(); }
  };
  const suspend = async (id: string, suspend: boolean) => {
    await supabase.from("institutions").update({ is_suspended: suspend }).eq("id", id);
    load();
  };
  const viewDoc = async (path: string) => {
    if (!path) return;
    const { data } = await supabase.storage.from("institution-documents").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const pending = insts.filter((i) => i.verification_status === "pending" && i.verification_paid);
  const others = insts.filter((i) => !(i.verification_status === "pending" && i.verification_paid));

  const Card1 = (i: any) => (
    <Card key={i.id}>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-start gap-3">
          {i.logo_url && <img src={i.logo_url} alt="" className="h-14 w-14 rounded-md object-cover" />}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{i.institution_name || "(no name)"}</h3>
              {i.verification_status === "verified" && <Badge variant="secondary"><BadgeCheck className="mr-1 h-3 w-3" />Verified</Badge>}
              {i.verification_status === "pending" && <Badge variant="outline">Pending</Badge>}
              {i.verification_status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
              {i.is_suspended && <Badge variant="destructive">Suspended</Badge>}
              {i.verification_paid && <Badge variant="outline">Paid</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{[i.city, i.country].filter(Boolean).join(", ")} • Reg: {i.registration_number || "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{i.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {i.registration_document_url && <Button size="sm" variant="outline" onClick={() => viewDoc(i.registration_document_url)}><FileText className="mr-1 h-3 w-3" />View doc</Button>}
              <Button size="sm" variant="outline" asChild><a href={`/institution/${i.id}`} target="_blank" rel="noreferrer">View profile</a></Button>
              {i.verification_status !== "verified" && i.verification_paid && (
                <Button size="sm" onClick={() => approve(i.id)}><BadgeCheck className="mr-1 h-3 w-3" />Approve</Button>
              )}
              {i.verification_status !== "rejected" && (
                <div className="flex items-center gap-2">
                  <Input className="h-8 w-48" placeholder="Rejection reason" value={rejectionReason[i.id] || ""} onChange={(e) => setRejectionReason((r) => ({ ...r, [i.id]: e.target.value }))} />
                  <Button size="sm" variant="destructive" onClick={() => reject(i.id)}><ShieldX className="mr-1 h-3 w-3" />Reject</Button>
                </div>
              )}
              <Button size="sm" variant="outline" onClick={() => suspend(i.id, !i.is_suspended)}>{i.is_suspended ? "Unsuspend" : "Suspend"}</Button>
            </div>
            {i.rejection_reason && <p className="mt-2 text-xs text-destructive">Reason: {i.rejection_reason}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" />Pending verification ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? <p className="text-sm text-muted-foreground">No paid pending requests.</p> : pending.map(Card1)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>All institutions ({others.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">{others.map(Card1)}</CardContent>
      </Card>
    </div>
  );
};

export default InstitutionsAdminTab;
