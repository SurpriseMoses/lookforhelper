import { Link } from "react-router-dom";
import { MapPin, BadgeCheck, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SaveInstitutionButton from "./SaveInstitutionButton";

interface Course { course_name: string; fee: number | null; currency: string }

interface Props {
  institution: {
    id: string;
    institution_name: string;
    description?: string | null;
    country: string;
    city?: string | null;
    logo_url?: string | null;
    banner_url?: string | null;
    verification_status: string;
  };
  courses?: Course[];
}

const InstitutionCard = ({ institution, courses = [] }: Props) => {
  const verified = institution.verification_status === "verified";
  const startingFee = courses.length
    ? courses.reduce((min, c) => (c.fee && c.fee > 0 && (min === null || c.fee < min) ? c.fee : min), null as number | null)
    : null;
  const currency = courses[0]?.currency || "ZAR";
  const courseNames = courses.slice(0, 3).map((c) => c.course_name).join(" • ");

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
      <SaveInstitutionButton institutionId={institution.id} />
      <Link to={`/institution/${institution.id}`} className="block">
        <div className="relative h-28 bg-gradient-to-br from-primary/15 to-accent/20">
          {institution.banner_url && (
            <img src={institution.banner_url} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute -bottom-8 left-4 h-16 w-16 overflow-hidden rounded-xl border-4 border-card bg-card shadow">
            {institution.logo_url ? (
              <img src={institution.logo_url} alt={institution.institution_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold text-primary">
                {institution.institution_name.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
        </div>
        <CardContent className="pt-10">
          <div className="flex items-start gap-2">
            <h3 className="flex-1 font-semibold leading-tight line-clamp-2">{institution.institution_name || "Unnamed institution"}</h3>
            {verified && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                <BadgeCheck className="h-3 w-3" /> Verified
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{[institution.city, institution.country].filter(Boolean).join(", ")}</span>
          </div>
          {courseNames && (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
              <GraduationCap className="mr-1 inline h-3 w-3" />
              {courseNames}
            </p>
          )}
          {institution.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{institution.description}</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm">
              {startingFee !== null ? (
                <span className="font-semibold text-primary">From {currency} {startingFee}</span>
              ) : (
                <span className="text-xs text-muted-foreground">View courses</span>
              )}
            </div>
            <Button size="sm" variant="outline">View Institution</Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default InstitutionCard;
