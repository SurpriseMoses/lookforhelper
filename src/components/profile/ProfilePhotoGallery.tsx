import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  helperUserId: string;
}

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
}

const ProfilePhotoGallery = ({ helperUserId }: Props) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("helper_photos" as any)
        .select("id, photo_url, caption")
        .eq("user_id", helperUserId)
        .order("display_order", { ascending: true });
      setPhotos((data as any[]) ?? []);
    };
    load();
  }, [helperUserId]);

  if (photos.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="font-display text-lg font-semibold text-foreground mb-3">Photo Gallery</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo.photo_url)}
            className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity"
          >
            <img
              src={photo.photo_url}
              alt={photo.caption || "Gallery photo"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoGallery;
