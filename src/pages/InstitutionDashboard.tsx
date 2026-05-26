import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { BadgeCheck, ShieldAlert, CreditCard, Plus, Trash2, Megaphone, GraduationCap, Image as ImageIcon, Building2 } from "lucide-react";
import { INSTITUTION_COURSE_CATEGORIES, getInstitutionPricing } from "@/lib/institutionCategories";

const InstitutionDashboard = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [inst, setInst] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ institution_name: "", description: "", city: "", country: "", phone: "", email: "", website: "", facebook_url: "", instagram_url: "", tiktok_url: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    const { data: i } = await supabase.from("institutions").select("*").eq("user_id", user.id).maybeSingle();
    if (!i) { setLoading(false); return; }
    setInst(i);
    setProfileForm({
      institution_name: i.institution_name || "",
      description: i.description || "",
      city: i.city || "",
      country: i.country || "",
      phone: i.phone || "",
      email: i.email || "",
      website: i.website || "",
      facebook_url: i.facebook_url || "",
      instagram_url: i.instagram_url || "",
      tiktok_url: i.tiktok_url || "",
    });
    const [{ data: cs }, { data: g }, { data: a }] = await Promise.all([
      supabase.from("institution_courses").select("*").eq("institution_id", i.id).order("created_at"),
      supabase.from("institution_gallery").select("*").eq("institution_id", i.id).order("display_order"),
      supabase.from("institution_announcements").select("*").eq("institution_id", i.id).order("created_at", { ascending: false }),
    ]);
    setCourses(cs || []);
    setGallery(g || []);
    setAnnouncements(a || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { void reload(); }, [reload]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (role && role !== "institution" && role !== "admin") return <Navigate to="/dashboard" replace />;
  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="container py-16 text-center text-muted-foreground">Loading...</div></div>;
  if (!inst) return <div className="min-h-screen bg-background"><Navbar /><div className="container py-16 text-center"><p className="mb-4">No institution found.</p><Button asChild><a href="/auth/institution">Register an institution</a></Button></div></div>;

  const verified = inst.verification_status === "verified";
  const pricing = getInstitutionPricing(inst.country);

  // ============ PROFILE ============
  const saveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase.from("institutions").update(profileForm).eq("id", inst.id);
    setSavingProfile(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Profile saved" }); reload(); }
  };

  const uploadImage = async (bucket: string, field: "logo_url" | "banner_url", file: File) => {
    const path = `${user.id}/${field}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    await supabase.from("institutions").update({ [field]: pub.publicUrl }).eq("id", inst.id);
    toast({ title: "Updated" });
    reload();
  };

  // ============ VERIFICATION PAYMENT ============
  const payVerification = async () => {
    const { data, error } = await supabase.functions.invoke("paystack-institution-verification", {
      body: { action: "initialize" },
    });
    if (error || !data?.authorization_url) {
      toast({ title: "Payment failed", description: error?.message || "Could not start payment", variant: "destructive" });
      return;
    }
    window.location.href = data.authorization_url;
  };

  // ============ COURSES ============
  const [newCourse, setNewCourse] = useState({ course_name: "", category: INSTITUTION_COURSE_CATEGORIES[0], duration: "", fee: "", currency: pricing.currency, certificate_included: false, installments_available: false, requirements: "", description: "" });
  const addCourse = async () => {
    if (!verified) { toast({ title: "Verification required", description: "Get verified to add courses.", variant: "destructive" }); return; }
    if (!newCourse.course_name.trim()) { toast({ title: "Course name required", variant: "destructive" }); return; }
    const { error } = await supabase.from("institution_courses").insert({
      institution_id: inst.id,
      course_name: newCourse.course_name,
      category: newCourse.category,
      duration: newCourse.duration,
      fee: parseFloat(newCourse.fee) || 0,
      currency: newCourse.currency,
      certificate_included: newCourse.certificate_included,
      installments_available: newCourse.installments_available,
      requirements: newCourse.requirements,
      description: newCourse.description,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Course added" }); setNewCourse((n) => ({ ...n, course_name: "", duration: "", fee: "", requirements: "", description: "" })); reload(); }
  };
  const deleteCourse = async (id: string) => {
    await supabase.from("institution_courses").delete().eq("id", id);
    reload();
  };

  // ============ GALLERY ============
  const uploadGallery = async (file: File) => {
    if (!verified) { toast({ title: "Verification required", variant: "destructive" }); return; }
    const path = `${user.id}/gallery-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("institution-gallery").upload(path, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
    const { data: pub } = supabase.storage.from("institution-gallery").getPublicUrl(path);
    await supabase.from("institution_gallery").insert({ institution_id: inst.id, image_url: pub.publicUrl });
    reload();
  };
  const deleteGalleryItem = async (id: string) => {
    await supabase.from("institution_gallery").delete().eq("id", id);
    reload();
  };

  // ============ ANNOUNCEMENTS ============
  const [annForm, setAnnForm] = useState({ title: "", caption: "" });
  const [annImage, setAnnImage] = useState<File | null>(null);
  const recentFreeCount = announcements.filter((a) => !a.is_paid && new Date(a.created_at) > new Date(Date.now() - 7 * 86400000)).length;
  const needsPayment = recentFreeCount >= 1;

  const createAnnouncement = async () => {
    if (!verified) { toast({ title: "Verification required", variant: "destructive" }); return; }
    if (!annForm.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }

    let image_url: string | null = null;
    if (annImage) {
      const path = `${user.id}/announcement-${Date.now()}-${annImage.name}`;
      const { error } = await supabase.storage.from("institution-announcements").upload(path, annImage);
      if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
      image_url = supabase.storage.from("institution-announcements").getPublicUrl(path).data.publicUrl;
    }

    if (needsPayment) {
      // Initialize paystack with announcement metadata, then complete creation on payment success via callback
      const { data, error } = await supabase.functions.invoke("paystack-institution-announcement", {
        body: { action: "initialize", title: annForm.title, caption: annForm.caption, image_url },
      });
      if (error || !data?.authorization_url) {
        toast({ title: "Payment failed", description: error?.message || "Could not start payment", variant: "destructive" });
        return;
      }
      // Stash announcement payload to be created after success in URL state
      sessionStorage.setItem("pending_announcement", JSON.stringify({ title: annForm.title, caption: annForm.caption, image_url, reference: data.reference, institution_id: inst.id }));
      window.location.href = data.authorization_url;
      return;
    }

    const { error } = await supabase.from("institution_announcements").insert({
      institution_id: inst.id, title: annForm.title, caption: annForm.caption, image_url, is_paid: false,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Announcement posted!" }); setAnnForm({ title: "", caption: "" }); setAnnImage(null); reload(); }
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from("institution_announcements").delete().eq("id", id);
    reload();
  };

  // Handle return from announcement payment
  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("reference") || url.searchParams.get("trxref");
    const pending = sessionStorage.getItem("pending_announcement");
    if (ref && pending) {
      (async () => {
        const { data } = await supabase.functions.invoke("paystack-institution-announcement", {
          body: { action: "verify", reference: ref },
        });
        if (data?.success) {
          const p = JSON.parse(pending);
          await supabase.from("institution_announcements").insert({
            institution_id: p.institution_id, title: p.title, caption: p.caption, image_url: p.image_url, is_paid: true, payment_reference: ref,
          });
          toast({ title: "Announcement posted!" });
        }
        sessionStorage.removeItem("pending_announcement");
        url.searchParams.delete("reference");
        url.searchParams.delete("trxref");
        window.history.replaceState({}, "", url.toString());
        reload();
      })();
    }
    // Handle verification payment return
    if (ref && !pending) {
      (async () => {
        await supabase.functions.invoke("paystack-institution-verification", { body: { action: "verify", reference: ref } });
        url.searchParams.delete("reference");
        url.searchParams.delete("trxref");
        window.history.replaceState({}, "", url.toString());
        toast({ title: "Payment received", description: "Your verification is under admin review." });
        reload();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusBadge = () => {
    if (verified) return <Badge variant="secondary" className="gap-1"><BadgeCheck className="h-3 w-3" />Verified</Badge>;
    if (inst.verification_status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="outline"><ShieldAlert className="mr-1 h-3 w-3" />Pending verification</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Institution Dashboard | Look For Helper" description="Manage your training institution profile, courses, gallery, and announcements." path="/institution-dashboard" noindex />
      <Navbar />
      <div className="container max-w-5xl py-6 md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary" />
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">{inst.institution_name || "Your institution"}</h1>
            <div className="mt-1">{statusBadge()}</div>
          </div>
        </div>

        {!verified && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Get verified — {pricing.currency} {pricing.verification}</CardTitle>
              <CardDescription>Pay the one-off verification fee. After payment, our admin team will review your documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={payVerification} disabled={inst.verification_paid}>
                <CreditCard className="mr-2 h-4 w-4" />
                {inst.verification_paid ? "Payment received — awaiting review" : `Pay ${pricing.currency} ${pricing.verification}`}
              </Button>
              {inst.rejection_reason && (
                <p className="mt-3 text-sm text-destructive">Rejection reason: {inst.rejection_reason}</p>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Logo</Label>
                    {inst.logo_url && <img src={inst.logo_url} alt="" className="my-2 h-20 w-20 rounded-lg object-cover" />}
                    <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage("institution-logos", "logo_url", f); }} />
                  </div>
                  <div>
                    <Label>Banner</Label>
                    {inst.banner_url && <img src={inst.banner_url} alt="" className="my-2 h-20 w-full rounded-lg object-cover" />}
                    <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage("institution-banners", "banner_url", f); }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1"><Label>Institution name</Label><Input value={profileForm.institution_name} onChange={(e) => setProfileForm((f) => ({ ...f, institution_name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Description</Label><Textarea rows={5} value={profileForm.description} onChange={(e) => setProfileForm((f) => ({ ...f, description: e.target.value }))} /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label>Country</Label><Input value={profileForm.country} onChange={(e) => setProfileForm((f) => ({ ...f, country: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>City</Label><Input value={profileForm.city} onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Phone</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Email</Label><Input value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Website</Label><Input value={profileForm.website} onChange={(e) => setProfileForm((f) => ({ ...f, website: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Facebook</Label><Input value={profileForm.facebook_url} onChange={(e) => setProfileForm((f) => ({ ...f, facebook_url: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Instagram</Label><Input value={profileForm.instagram_url} onChange={(e) => setProfileForm((f) => ({ ...f, instagram_url: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>TikTok</Label><Input value={profileForm.tiktok_url} onChange={(e) => setProfileForm((f) => ({ ...f, tiktok_url: e.target.value }))} /></div>
                </div>
                <Button onClick={saveProfile} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save profile"}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COURSES TAB */}
          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Add a course</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Course name" value={newCourse.course_name} onChange={(e) => setNewCourse((c) => ({ ...c, course_name: e.target.value }))} />
                <Select value={newCourse.category} onValueChange={(v) => setNewCourse((c) => ({ ...c, category: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INSTITUTION_COURSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input placeholder="Duration (e.g. 6 weeks)" value={newCourse.duration} onChange={(e) => setNewCourse((c) => ({ ...c, duration: e.target.value }))} />
                  <Input placeholder="Fee" type="number" value={newCourse.fee} onChange={(e) => setNewCourse((c) => ({ ...c, fee: e.target.value }))} />
                  <Input placeholder="Currency" value={newCourse.currency} onChange={(e) => setNewCourse((c) => ({ ...c, currency: e.target.value }))} />
                </div>
                <Textarea rows={2} placeholder="Requirements" value={newCourse.requirements} onChange={(e) => setNewCourse((c) => ({ ...c, requirements: e.target.value }))} />
                <Textarea rows={3} placeholder="Description" value={newCourse.description} onChange={(e) => setNewCourse((c) => ({ ...c, description: e.target.value }))} />
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={newCourse.certificate_included} onCheckedChange={(v) => setNewCourse((c) => ({ ...c, certificate_included: !!v }))} />Certificate included</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={newCourse.installments_available} onCheckedChange={(v) => setNewCourse((c) => ({ ...c, installments_available: !!v }))} />Installments available</label>
                </div>
                <Button onClick={addCourse} disabled={!verified}><Plus className="mr-1 h-4 w-4" />Add course</Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {courses.map((c) => (
                <Card key={c.id}>
                  <CardContent className="flex items-start gap-3 pt-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{c.course_name}</h3>
                        <Badge variant="outline">{c.category}</Badge>
                        {c.certificate_included && <Badge variant="secondary">Certificate</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{c.duration} • {c.currency} {c.fee}</p>
                      {c.description && <p className="mt-1 text-sm">{c.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteCourse(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* GALLERY TAB */}
          <TabsContent value="gallery" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Upload photos (free)</CardTitle><CardDescription>Show training activities, graduations and workshops.</CardDescription></CardHeader>
              <CardContent>
                <Input type="file" accept="image/*" disabled={!verified} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadGallery(f); }} />
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {gallery.map((g) => (
                <div key={g.id} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <img src={g.image_url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => deleteGalleryItem(g.id)} className="absolute right-1 top-1 rounded-full bg-background/80 p-1"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ANNOUNCEMENTS TAB */}
          <TabsContent value="announcements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" />New announcement</CardTitle>
                <CardDescription>
                  Verified institutions get 1 free post per week. Extra posts cost {pricing.currency} {pricing.announcement}. Posts expire after 14 days.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Title" value={annForm.title} onChange={(e) => setAnnForm((f) => ({ ...f, title: e.target.value }))} maxLength={120} />
                <Textarea rows={3} placeholder="Caption" value={annForm.caption} onChange={(e) => setAnnForm((f) => ({ ...f, caption: e.target.value }))} maxLength={500} />
                <Input type="file" accept="image/*" onChange={(e) => setAnnImage(e.target.files?.[0] || null)} />
                <Button onClick={createAnnouncement} disabled={!verified}>
                  {needsPayment ? `Pay ${pricing.currency} ${pricing.announcement} & post` : "Post (free this week)"}
                </Button>
              </CardContent>
            </Card>
            <div className="space-y-3">
              {announcements.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex items-start gap-3 pt-6">
                    {a.image_url && <img src={a.image_url} alt="" className="h-20 w-20 rounded-md object-cover" />}
                    <div className="flex-1">
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-sm text-muted-foreground">{a.caption}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(a.expires_at) > new Date() ? `Expires ${new Date(a.expires_at).toLocaleDateString()}` : "Expired"}
                        {a.is_paid && " • Paid"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteAnnouncement(a.id)}><Trash2 className="h-4 w-4" /></Button>
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

export default InstitutionDashboard;
