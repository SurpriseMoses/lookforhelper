import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface WhatsAppShareButtonProps {
  fullName: string;
  primarySkill?: string;
  city?: string;
  rating?: number;
  userId: string;
}

const WhatsAppShareButton = ({ fullName, primarySkill, city, rating, userId }: WhatsAppShareButtonProps) => {
  const profileLink = `${window.location.origin}/helper/${userId}`;

  const message = [
    `I found a helper on Look for Helper:`,
    `Name: ${fullName}`,
    primarySkill && `Service: ${primarySkill}`,
    city && `Location: ${city}`,
    rating && rating > 0 ? `Rating: ${rating.toFixed(1)} ⭐` : null,
    `View profile: ${profileLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
      asChild
    >
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4" /> Share on WhatsApp
      </a>
    </Button>
  );
};

export default WhatsAppShareButton;
