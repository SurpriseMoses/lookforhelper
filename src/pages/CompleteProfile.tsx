import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CityAutocomplete from "@/components/search/CityAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/Navbar";
import { UserCheck, Briefcase, Search } from "lucide-react";

const CompleteProfile = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<"seeker" | "helper">("seeker");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [cityLat, setCityLat] = useState<number | undefined>();
  const [cityLng, setCityLng] = useState<number | undefined>();
  const [country, setCountry] = useState("South Africa");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    // Pre-fill name from Google metadata
    if (user) {
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name || "";
      setFullName(googleName);
    }
  }, [user, loading, navigate]);

  // If user already has a role explicitly set (email signup), redirect to dashboard
  useEffect(() => {
    if (!loading && user && user.user_metadata?.role) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      // 1. Update user metadata with chosen role
      await supabase.auth.updateUser({
        data: { role: selectedRole, full_name: fullName },
      });

      // 2. Update profile name
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user.id);

      // 3. Update user_roles - the trigger defaulted to 'seeker', update if 'helper'
      if (selectedRole === "helper") {
        await supabase
          .from("user_roles")
          .update({ role: selectedRole })
          .eq("user_id", user.id);

        // Create helper_details row (trigger only fires on role insert, not update)
        await supabase
          .from("helper_details")
          .upsert({ user_id: user.id, city, province, country }, { onConflict: "user_id" });
      }

      // 4. Create seeker subscription if seeker (trigger fires on role insert)
      if (selectedRole === "seeker") {
        await supabase
          .from("seeker_subscriptions")
          .upsert({ user_id: user.id }, { onConflict: "user_id" });
      }

      toast({
        title: "Profile complete!",
        description: selectedRole === "helper"
          ? "Welcome! Head to your dashboard to finish setting up your listing."
          : "Welcome! You can now browse and contact helpers.",
      });

      // Force a re-fetch of role in AuthContext
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container flex items-center justify-center py-16">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Just a few details to get you started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-3">
                <Label>I am a...</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as "seeker" | "helper")}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="role-seeker"
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      selectedRole === "seeker"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="seeker" id="role-seeker" className="sr-only" />
                    <Search className="h-6 w-6 text-primary" />
                    <span className="font-medium">Seeker</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Looking for help
                    </span>
                  </Label>
                  <Label
                    htmlFor="role-helper"
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      selectedRole === "helper"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="helper" id="role-helper" className="sr-only" />
                    <Briefcase className="h-6 w-6 text-primary" />
                    <span className="font-medium">Helper</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Looking for work
                    </span>
                  </Label>
                </RadioGroup>
              </div>

              {selectedRole === "helper" && (
                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-foreground">Location</p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <CityAutocomplete
                        value={city}
                        onCitySelect={(c, p) => {
                          setCity(c);
                          setProvince(p);
                          setCountry("South Africa");
                        }}
                        onClear={() => { setCity(""); setProvince(""); }}
                        placeholder="e.g. Cape Town"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Province</Label>
                        <Input value={province} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input value={country} disabled className="bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Signing in with Google does not verify your identity.
                  Helpers must still complete ID verification and background checks to earn trust badges.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !fullName.trim()}>
                {isSubmitting ? "Saving..." : "Continue to Dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfile;
