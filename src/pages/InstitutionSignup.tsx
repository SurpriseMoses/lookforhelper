import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import { Building2 } from "lucide-react";

const schema = z.object({
  institution_name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  country: z.string().min(2),
  city: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(5).max(30),
  description: z.string().trim().min(20).max(2000),
  courses_offered: z.string().trim().min(2).max(500),
  registration_number: z.string().trim().min(1).max(100),
  website: z.string().trim().max(255).optional().or(z.literal("")),
  facebook_url: z.string().trim().max(255).optional().or(z.literal("")),
  instagram_url: z.string().trim().max(255).optional().or(z.literal("")),
  tiktok_url: z.string().trim().max(255).optional().or(z.literal("")),
});

const InstitutionSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp } = useAuth();
  const [countries, setCountries] = useState<{ id: string; country_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState<File | null>(null);

  const [form, setForm] = useState({
    institution_name: "",
    email: "",
    password: "",
    country: "South Africa",
    city: "",
    phone: "",
    description: "",
    courses_offered: "",
    registration_number: "",
    website: "",
    facebook_url: "",
    instagram_url: "",
    tiktok_url: "",
  });

  useEffect(() => {
    supabase.from("countries").select("id, country_name").eq("is_active", true).order("country_name").then(({ data }) => {
      if (data) setCountries(data);
    });
  }, []);

  useEffect(() => {
    if (user) navigate("/institution-dashboard", { replace: true });
  }, [user, navigate]);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Please fix the form", description: Object.values(parsed.error.flatten().fieldErrors).flat()[0], variant: "destructive" });
      return;
    }
    if (!doc) {
      toast({ title: "Registration proof required", description: "Please upload your company registration proof.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // 1. Create auth user with role=institution
      await signUp(form.email, form.password, form.institution_name, "institution" as any, form.country);

      // Wait briefly for session
      await new Promise((r) => setTimeout(r, 800));
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) {
        toast({ title: "Account created", description: "Check your email to verify, then log in to complete verification." });
        navigate("/auth");
        return;
      }

      // 2. Upload registration document
      const path = `${uid}/registration-${Date.now()}-${doc.name}`;
      const { error: upErr } = await supabase.storage.from("institution-documents").upload(path, doc, { upsert: false });
      if (upErr) throw upErr;

      // 3. Update institutions row (auto-created by trigger)
      const { error: updErr } = await supabase
        .from("institutions")
        .update({
          institution_name: form.institution_name,
          description: form.description + "\n\nCourses offered: " + form.courses_offered,
          country: form.country,
          city: form.city,
          phone: form.phone,
          email: form.email,
          registration_number: form.registration_number,
          registration_document_url: path,
          website: form.website || null,
          facebook_url: form.facebook_url || null,
          instagram_url: form.instagram_url || null,
          tiktok_url: form.tiktok_url || null,
        })
        .eq("user_id", uid);
      if (updErr) throw updErr;

      toast({ title: "Submitted!", description: "Pay the verification fee from your dashboard to complete verification." });
      navigate("/institution-dashboard");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Register Your Training Institution | Look For Helper" description="Register your domestic worker training institution and reach helpers across Africa." path="/auth/institution" noindex />
      <Navbar />
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <CardTitle className="font-display">Register your institution</CardTitle>
            </div>
            <CardDescription>Join a trusted directory of domestic worker training providers.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Institution name *</Label>
                <Input value={form.institution_name} onChange={onChange("institution_name")} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={onChange("email")} required />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input type="password" value={form.password} onChange={onChange("password")} required minLength={6} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Select value={form.country} onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => <SelectItem key={c.id} value={c.country_name}>{c.country_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input value={form.city} onChange={onChange("city")} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone number *</Label>
                <Input value={form.phone} onChange={onChange("phone")} required />
              </div>
              <div className="space-y-2">
                <Label>Institution description *</Label>
                <Textarea value={form.description} onChange={onChange("description")} required rows={4} maxLength={2000} placeholder="Tell helpers about your training focus, history, and mission." />
              </div>
              <div className="space-y-2">
                <Label>Courses offered *</Label>
                <Textarea value={form.courses_offered} onChange={onChange("courses_offered")} required rows={2} placeholder="e.g. Childcare, Elderly care, First aid" />
                <p className="text-xs text-muted-foreground">You'll add detailed course cards after signup.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Registration number *</Label>
                  <Input value={form.registration_number} onChange={onChange("registration_number")} required />
                </div>
                <div className="space-y-2">
                  <Label>Upload registration proof *</Label>
                  <Input type="file" accept="image/*,application/pdf" onChange={(e) => setDoc(e.target.files?.[0] || null)} required />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label className="text-muted-foreground">Optional links</Label>
                <Input placeholder="Website URL" value={form.website} onChange={onChange("website")} />
                <Input placeholder="Facebook URL" value={form.facebook_url} onChange={onChange("facebook_url")} />
                <Input placeholder="Instagram URL" value={form.instagram_url} onChange={onChange("instagram_url")} />
                <Input placeholder="TikTok URL" value={form.tiktok_url} onChange={onChange("tiktok_url")} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create institution account"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                After signup you'll pay a one-off verification fee for admin review.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstitutionSignup;
