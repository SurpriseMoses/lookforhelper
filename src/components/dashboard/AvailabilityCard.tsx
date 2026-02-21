import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const WORK_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "live_in", label: "Live-in" },
  { value: "live_out", label: "Live-out" },
  { value: "temporary", label: "Temporary" },
];

const AvailabilityCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState("not_available");
  const [availableFrom, setAvailableFrom] = useState<Date | undefined>();
  const [workType, setWorkType] = useState<string[]>([]);
  const [preferredHours, setPreferredHours] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("helper_details")
        .select("availability_status, available_from, work_type, preferred_hours")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setStatus((data as any).availability_status ?? "not_available");
        setAvailableFrom((data as any).available_from ? new Date((data as any).available_from) : undefined);
        setWorkType((data as any).work_type ?? []);
        setPreferredHours((data as any).preferred_hours ?? "");
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("helper_details")
      .update({
        availability_status: status,
        available_from: status === "available_soon" && availableFrom ? availableFrom.toISOString().split("T")[0] : null,
        work_type: workType,
        preferred_hours: preferredHours || null,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Availability saved!" });
    }
  };

  const toggleWorkType = (value: string) => {
    setWorkType((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  if (!loaded) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status reminder */}
        {status === "available_now" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            🟢 Your profile is visible to seekers looking for immediate hires.
          </div>
        )}
        {status === "not_available" && (
          <div className="rounded-lg border border-muted bg-muted/50 p-3 text-sm text-muted-foreground">
            🔴 You may receive fewer inquiries while unavailable.
          </div>
        )}

        <div className="space-y-2">
          <Label>Current Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available_now">🟢 Available Now</SelectItem>
              <SelectItem value="available_soon">🟡 Available From (select date)</SelectItem>
              <SelectItem value="not_available">🔴 Not Available</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {status === "available_soon" && (
          <div className="space-y-2">
            <Label>Available From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !availableFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {availableFrom ? format(availableFrom, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={availableFrom}
                  onSelect={setAvailableFrom}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="space-y-2">
          <Label>Work Preference</Label>
          <div className="space-y-2">
            {WORK_TYPE_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  checked={workType.includes(opt.value)}
                  onCheckedChange={() => toggleWorkType(opt.value)}
                  id={`wt-${opt.value}`}
                />
                <Label htmlFor={`wt-${opt.value}`} className="cursor-pointer text-sm font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Preferred Schedule (optional)</Label>
          <Input
            placeholder="e.g. Weekdays only, Flexible, Weekends"
            value={preferredHours}
            onChange={(e) => setPreferredHours(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Availability"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCard;
