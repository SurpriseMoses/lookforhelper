import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import VerificationCard from "@/components/dashboard/VerificationCard";
import FeaturedBoostCard from "@/components/dashboard/FeaturedBoostCard";
import SeekerSubscriptionCard from "@/components/dashboard/SeekerSubscriptionCard";
import InviteEarnCard from "@/components/dashboard/InviteEarnCard";
import BackgroundCheckCard from "@/components/dashboard/BackgroundCheckCard";
import MyHiresCard from "@/components/dashboard/MyHiresCard";
import AvailabilityCard from "@/components/dashboard/AvailabilityCard";
import HelperListingCard from "@/components/dashboard/HelperListingCard";
import SeekerHiresSection from "@/components/dashboard/SeekerHiresSection";
import HelperPerformanceCard from "@/components/dashboard/HelperPerformanceCard";
import DeleteAccountCard from "@/components/dashboard/DeleteAccountCard";
import useLastActive from "@/hooks/useLastActive";

const SKILL_OPTIONS = ["Nanny", "Babysitter", "Cleaner", "Caregiver", "Cook", "Driver", "Gardener"];
const LANGUAGE_OPTIONS = ["English", "Afrikaans", "Zulu", "Xhosa", "Sotho", "Tswana", "Pedi", "Venda", "Tsonga", "Swati", "Ndebele", "French", "Portuguese"];

const Dashboard = () => {
  const { user, role, loading: authLoading, profileComplete, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  useLastActive();

  const [profile, setProfile] = useState({ full_name: "", avatar_url: "" });
  const [helperDetails, setHelperDetails] = useState({
    age: "",
    gender: "",
    city: "",
    country: "South Africa",
    willing_to_work_abroad: false,
    years_experience: "",
    skills: [] as string[],
    languages: [] as string[],
    salary_expectation: "",
    salary_min: "",
    salary_max: "",
    salary_negotiable: true,
    about_me: "",
    video_introduction_url: "",
    helper_references: [] as { name: string; contact: string; relationship: string }[],
    is_published: false,
    work_authorization_status: "",
  });
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && user && !profileComplete) {
      navigate("/complete-profile");
    }
  }, [authLoading, user, profileComplete, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (p) setProfile({ full_name: p.full_name, avatar_url: p.avatar_url ?? "" });

      if (role === "helper") {
        const { data: h } = await supabase
          .from("helper_details")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (h) {
          setHelperDetails({
            age: h.age?.toString() ?? "",
            gender: h.gender ?? "",
            city: h.city ?? "",
            country: h.country ?? "South Africa",
            willing_to_work_abroad: h.willing_to_work_abroad ?? false,
            years_experience: h.years_experience?.toString() ?? "",
            skills: h.skills ?? [],
            languages: h.languages ?? [],
            salary_expectation: h.salary_expectation ?? "",
            salary_min: (h as any).salary_min?.toString() ?? "",
            salary_max: (h as any).salary_max?.toString() ?? "",
            salary_negotiable: h.salary_negotiable ?? true,
            about_me: h.about_me ?? "",
            video_introduction_url: (h as any).video_introduction_url ?? "",
            helper_references: (h.helper_references as any[]) ?? [],
            is_published: h.is_published ?? false,
            work_authorization_status: (h as any).work_authorization_status ?? "",
          });
        }
      }
      setDataLoading(false);
    };
    load();
  }, [user, role]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ full_name: profile.full_name })
        .eq("user_id", user.id);

      if (role === "helper") {
        await supabase
          .from("helper_details")
          .update({
            age: helperDetails.age ? parseInt(helperDetails.age) : null,
            gender: helperDetails.gender || null,
            city: helperDetails.city,
            country: helperDetails.country,
            willing_to_work_abroad: helperDetails.willing_to_work_abroad,
            years_experience: helperDetails.years_experience ? parseInt(helperDetails.years_experience) : null,
            skills: helperDetails.skills,
            languages: helperDetails.languages,
            salary_expectation: helperDetails.salary_expectation,
            salary_min: helperDetails.salary_min ? parseInt(helperDetails.salary_min) : null,
            salary_max: helperDetails.salary_max ? parseInt(helperDetails.salary_max) : null,
            salary_negotiable: helperDetails.salary_negotiable,
            about_me: helperDetails.about_me,
            video_introduction_url: helperDetails.video_introduction_url || null,
            helper_references: helperDetails.helper_references,
            is_published: helperDetails.is_published,
            work_authorization_status: helperDetails.work_authorization_status || null,
          })
          .eq("user_id", user.id);
      }

      toast({ title: "Profile saved!" });
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = urlData.publicUrl;
    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
    setProfile((p) => ({ ...p, avatar_url: url }));
    toast({ title: "Photo uploaded!" });
  };

  const toggleSkill = (skill: string) => {
    setHelperDetails((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setHelperDetails((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {role === "helper" ? "Helper Dashboard" : "Seeker Dashboard"}
          </h1>
          <Button variant="outline" onClick={signOut}>Sign Out</Button>
        </div>

        {/* Profile basics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xl font-bold text-muted-foreground/30">
                    {profile.full_name?.charAt(0) ?? "?"}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer text-sm font-medium text-primary hover:underline">
                  Upload photo
                </Label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={profile.full_name}
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Seeker-specific */}
        {role === "seeker" && (
          <>
            <SeekerSubscriptionCard />
            <SeekerHiresSection />
          </>
        )}

        {/* Helper-specific fields */}
        {role === "helper" && (
          <>
          <HelperListingCard />
          <AvailabilityCard />
           <VerificationCard />
          <BackgroundCheckCard />
          <FeaturedBoostCard />
          <HelperPerformanceCard />
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Helper Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={helperDetails.age}
                    onChange={(e) => setHelperDetails((h) => ({ ...h, age: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={helperDetails.gender} onValueChange={(v) => setHelperDetails((h) => ({ ...h, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={helperDetails.city} onChange={(e) => setHelperDetails((h) => ({ ...h, city: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={helperDetails.country} onChange={(e) => setHelperDetails((h) => ({ ...h, country: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    value={helperDetails.years_experience}
                    onChange={(e) => setHelperDetails((h) => ({ ...h, years_experience: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salary Min (ZAR/month)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 3000"
                    value={helperDetails.salary_min}
                    onChange={(e) => setHelperDetails((h) => ({ ...h, salary_min: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salary Max (ZAR/month)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 8000"
                    value={helperDetails.salary_max}
                    onChange={(e) => setHelperDetails((h) => ({ ...h, salary_max: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={helperDetails.salary_negotiable}
                  onCheckedChange={(v) => setHelperDetails((h) => ({ ...h, salary_negotiable: v }))}
                />
                <Label>Salary is negotiable</Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={helperDetails.willing_to_work_abroad}
                  onCheckedChange={(v) => setHelperDetails((h) => ({ ...h, willing_to_work_abroad: v }))}
                />
                <Label>Willing to work abroad</Label>
              </div>

              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => (
                    <Badge
                      key={skill}
                      variant={helperDetails.skills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                      {helperDetails.skills.includes(skill) && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <Badge
                      key={lang}
                      variant={helperDetails.languages.includes(lang) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleLanguage(lang)}
                    >
                      {lang}
                      {helperDetails.languages.includes(lang) && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Work Authorization */}
              <div className="space-y-2">
                <Label>Work Authorization Status</Label>
                <Select
                  value={helperDetails.work_authorization_status}
                  onValueChange={(v) => setHelperDetails((h) => ({ ...h, work_authorization_status: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sa_citizen">South African Citizen</SelectItem>
                    <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                    <SelectItem value="work_permit">Valid Work Permit</SelectItem>
                    <SelectItem value="asylum_permit">Asylum Permit</SelectItem>
                    <SelectItem value="refugee_permit">Refugee Permit</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to specify</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Optional — helps employers understand your work eligibility.</p>
              </div>

              <div className="space-y-2">
                <Label>About Me</Label>
                <Textarea
                  rows={4}
                  placeholder="Tell employers about yourself..."
                  value={helperDetails.about_me}
                  onChange={(e) => setHelperDetails((h) => ({ ...h, about_me: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Video Introduction</Label>
                {helperDetails.video_introduction_url && (
                  <div className="rounded-lg border p-3 space-y-2">
                    <video
                      src={helperDetails.video_introduction_url}
                      controls
                      className="w-full max-h-48 rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setHelperDetails((h) => ({ ...h, video_introduction_url: "" }))}
                    >
                      Remove video
                    </Button>
                  </div>
                )}
                <div>
                  <Label htmlFor="video-upload" className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    {helperDetails.video_introduction_url ? "Replace video" : "Upload a video"}
                  </Label>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !user) return;
                      if (file.size > 50 * 1024 * 1024) {
                        toast({ title: "File too large", description: "Max 50 MB", variant: "destructive" });
                        return;
                      }
                      const path = `${user.id}/${Date.now()}-${file.name}`;
                      const { error } = await supabase.storage.from("helper-videos").upload(path, file);
                      if (error) {
                        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
                        return;
                      }
                      const { data: urlData } = supabase.storage.from("helper-videos").getPublicUrl(path);
                      setHelperDetails((h) => ({ ...h, video_introduction_url: urlData.publicUrl }));
                      toast({ title: "Video uploaded!" });
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Upload a short video introducing yourself (max 50 MB)</p>
              </div>

              {/* References */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>References</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setHelperDetails((h) => ({
                        ...h,
                        helper_references: [...h.helper_references, { name: "", contact: "", relationship: "" }],
                      }))
                    }
                  >
                    + Add Reference
                  </Button>
                </div>
                {helperDetails.helper_references.map((ref, i) => (
                  <div key={i} className="flex flex-col gap-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Reference {i + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setHelperDetails((h) => ({
                            ...h,
                            helper_references: h.helper_references.filter((_, idx) => idx !== i),
                          }))
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Name"
                      value={ref.name}
                      onChange={(e) => {
                        const refs = [...helperDetails.helper_references];
                        refs[i] = { ...refs[i], name: e.target.value };
                        setHelperDetails((h) => ({ ...h, helper_references: refs }));
                      }}
                    />
                    <Input
                      placeholder="Contact (phone or email)"
                      value={ref.contact}
                      onChange={(e) => {
                        const refs = [...helperDetails.helper_references];
                        refs[i] = { ...refs[i], contact: e.target.value };
                        setHelperDetails((h) => ({ ...h, helper_references: refs }));
                      }}
                    />
                    <Input
                      placeholder="Relationship (e.g. Previous employer)"
                      value={ref.relationship}
                      onChange={(e) => {
                        const refs = [...helperDetails.helper_references];
                        refs[i] = { ...refs[i], relationship: e.target.value };
                        setHelperDetails((h) => ({ ...h, helper_references: refs }));
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
                <Switch
                  checked={helperDetails.is_published}
                  onCheckedChange={(v) => setHelperDetails((h) => ({ ...h, is_published: v }))}
                />
                <div>
                  <Label className="font-medium">Publish profile</Label>
                  <p className="text-xs text-muted-foreground">
                    Make your profile visible to seekers on the platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          </>
        )}

        <MyHiresCard />
        <InviteEarnCard />

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Profile"}
        </Button>

        <div className="mt-8">
          <DeleteAccountCard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
