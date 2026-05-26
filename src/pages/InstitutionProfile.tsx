import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck, MapPin, Phone, Mail, Globe, GraduationCap, Award, Megaphone, Building2 } from "lucide-react";
import SaveInstitutionButton from "@/components/institutions/SaveInstitutionButton";

const InstitutionProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [inst, setInst] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: i } = await supabase.from("institutions").select("*").eq("id", id).maybeSingle();
      setInst(i);
      const [{ data: cs }, { data: g }, { data: a }] = await Promise.all([
        supabase.from("institution_courses").select("*").eq("institution_id", id).order("created_at"),
        supabase.from("institution_gallery").select("*").eq("institution_id", id).order("display_order"),
        supabase.from("institution_announcements").select("*").eq("institution_id", id).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
      ]);
      setCourses(cs || []);
      setGallery(g || []);
      setAnnouncements(a || []);
    })();
  }, [id]);

  if (!inst) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const verified = inst.verification_status === "verified";

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${inst.institution_name} | Training Institution`} description={(inst.description || "").slice(0, 155)} path={`/institution/${inst.id}`} />
      <Navbar />

      {/* Header */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 to-accent/30">
        {inst.banner_url && <img src={inst.banner_url} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="container -mt-16 pb-12">
        <Card className="relative overflow-visible">
          <SaveInstitutionButton institutionId={inst.id} className="top-4 right-4" />
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="-mt-16 h-24 w-24 shrink-0 overflow-hidden rounded-xl border-4 border-card bg-card shadow-md">
                {inst.logo_url ? (
                  <img src={inst.logo_url} alt={inst.institution_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-3xl font-bold text-primary">
                    {inst.institution_name.charAt(0).toUpperCase() || <Building2 />}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">{inst.institution_name}</h1>
                  {verified && (
                    <Badge variant="secondary" className="gap-1">
                      <BadgeCheck className="h-3 w-3" /> Verified Institution
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{[inst.city, inst.country].filter(Boolean).join(", ")}</span>
                  {inst.phone && <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" />{inst.phone}</span>}
                  {inst.email && <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" />{inst.email}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {inst.website && <Button size="sm" variant="outline" asChild><a href={inst.website} target="_blank" rel="noopener noreferrer"><Globe className="mr-1 h-3.5 w-3.5" />Website</a></Button>}
                  {inst.facebook_url && <Button size="sm" variant="outline" asChild><a href={inst.facebook_url} target="_blank" rel="noopener noreferrer">Facebook</a></Button>}
                  {inst.instagram_url && <Button size="sm" variant="outline" asChild><a href={inst.instagram_url} target="_blank" rel="noopener noreferrer">Instagram</a></Button>}
                  {inst.tiktok_url && <Button size="sm" variant="outline" asChild><a href={inst.tiktok_url} target="_blank" rel="noopener noreferrer">TikTok</a></Button>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        {inst.description && (
          <Card className="mt-6">
            <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{inst.description}</p></CardContent>
          </Card>
        )}

        {/* Courses */}
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Courses Offered</h2>
          </div>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses listed yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.map((c) => (
                <Card key={c.id}>
                  <CardContent className="pt-6">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{c.course_name}</h3>
                      {c.certificate_included && <Badge variant="secondary" className="gap-1 shrink-0"><Award className="h-3 w-3" />Certificate</Badge>}
                    </div>
                    <Badge variant="outline" className="mb-2">{c.category}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {c.duration && <div><span className="font-medium text-foreground">Duration:</span> {c.duration}</div>}
                      <div><span className="font-medium text-foreground">Fee:</span> {c.currency} {c.fee} {c.installments_available && <span className="text-xs">(installments available)</span>}</div>
                      {c.requirements && <div><span className="font-medium text-foreground">Requirements:</span> {c.requirements}</div>}
                    </div>
                    {c.description && <p className="mt-3 text-sm">{c.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 font-display text-xl font-bold">Gallery</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {gallery.map((g) => (
                <button key={g.id} onClick={() => setLightbox(g.image_url)} className="aspect-square overflow-hidden rounded-md bg-muted">
                  <img src={g.image_url} alt={g.caption || ""} className="h-full w-full object-cover transition-transform hover:scale-105" />
                </button>
              ))}
            </div>
            {lightbox && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
                <img src={lightbox} alt="" className="max-h-full max-w-full" />
              </div>
            )}
          </div>
        )}

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Announcements</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {announcements.map((a) => (
                <Card key={a.id}>
                  {a.image_url && <img src={a.image_url} alt="" className="h-40 w-full object-cover" />}
                  <CardContent className="pt-4">
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.caption}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Expires {new Date(a.expires_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionProfile;
