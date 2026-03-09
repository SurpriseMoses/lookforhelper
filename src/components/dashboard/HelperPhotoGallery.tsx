import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Camera, X, Plus } from "lucide-react";

interface HelperPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  display_order: number;
}

const HelperPhotoGallery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<HelperPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadPhotos();
  }, [user]);

  const loadPhotos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("helper_photos" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true });
    setPhotos((data as any[]) ?? []);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5 MB per photo", variant: "destructive" });
      return;
    }

    if (photos.length >= 8) {
      toast({ title: "Gallery full", description: "Maximum 8 photos allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    const path = `${user.id}/gallery/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: insertErr } = await supabase
      .from("helper_photos" as any)
      .insert({
        user_id: user.id,
        photo_url: urlData.publicUrl,
        display_order: photos.length,
      } as any);

    if (insertErr) {
      toast({ title: "Failed to save", description: insertErr.message, variant: "destructive" });
    } else {
      toast({ title: "Photo added!" });
      loadPhotos();
    }
    setUploading(false);
  };

  const handleDelete = async (photoId: string) => {
    const { error } = await supabase
      .from("helper_photos" as any)
      .delete()
      .eq("id", photoId);

    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast({ title: "Photo removed" });
    }
  };

  if (loading) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="h-5 w-5" /> Photo Gallery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
          Upload up to 8 photos to showcase your work environment or experience ({photos.length}/8)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={photo.photo_url}
                alt="Gallery"
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {photos.length < 8 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
              <Plus className="h-6 w-6 text-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground/50 mt-1">
                {uploading ? "Uploading..." : "Add Photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HelperPhotoGallery;
