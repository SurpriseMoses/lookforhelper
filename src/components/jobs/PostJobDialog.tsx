import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, AlertTriangle } from "lucide-react";
import CityAutocomplete from "@/components/search/CityAutocomplete";

const SKILL_OPTIONS = ["Nanny", "Babysitter", "Cleaner", "Caregiver", "Cook", "Driver", "Gardener"];

interface PostJobDialogProps {
  onJobPosted?: () => void;
  trigger?: React.ReactNode;
}

const PostJobDialog = ({ onJobPosted, trigger }: PostJobDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [locationPref, setLocationPref] = useState("country");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();

  const checkVerification = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("user_id", user.id)
      .single();
    
    if (!data?.is_verified) {
      setIsVerified(false);
      toast({
        title: "Verification Required",
        description: "Only verified seekers can post jobs. Please complete identity verification first.",
        variant: "destructive",
      });
      return false;
    }
    setIsVerified(true);
    return true;
  };

  const handleOpen = async (isOpen: boolean) => {
    if (isOpen) {
      const verified = await checkVerification();
      if (!verified) return;
    }
    setOpen(isOpen);
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    if (!user || skills.length === 0) {
      toast({ title: "Please select at least one skill", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Please add a job title", variant: "destructive" });
      return;
    }

    setLoading(true);
    const userCountry = user.user_metadata?.country || "South Africa";

    const { error } = await supabase.from("jobs" as any).insert({
      seeker_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      skills,
      location_preference: locationPref,
      city: city || null,
      country: userCountry,
      province: province || null,
      latitude: lat || null,
      longitude: lng || null,
    } as any);

    setLoading(false);
    if (error) {
      toast({ title: "Failed to post job", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Job posted successfully!" });
    setOpen(false);
    setTitle("");
    setDescription("");
    setSkills([]);
    setCity("");
    setProvince("");
    onJobPosted?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Post a Job
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a Domestic Job</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Job Title</Label>
            <Input
              placeholder="e.g. Looking for a live-in nanny"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Describe the job requirements, hours, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Required Skills (select one or more)</Label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <Badge
                  key={skill}
                  variant={skills.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  {skills.includes(skill) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location Preference</Label>
            <Select value={locationPref} onValueChange={setLocationPref}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="near_me">Near my location</SelectItem>
                <SelectItem value="country">In my country</SelectItem>
                <SelectItem value="global">Global / Anywhere</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {locationPref === "near_me" && (
            <div className="space-y-2">
              <Label>Your City</Label>
              <CityAutocomplete
                value={city}
                onCitySelect={(c, p, la, ln) => {
                  setCity(c);
                  setProvince(p);
                  setLat(la);
                  setLng(ln);
                }}
                onClear={() => {
                  setCity("");
                  setProvince("");
                }}
              />
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Posting..." : "Post Job"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostJobDialog;
