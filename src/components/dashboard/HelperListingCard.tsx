import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Sparkles } from "lucide-react";

const HelperListingCard = () => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Platform Visibility</CardTitle>
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
            <Eye className="mr-1 h-3 w-3" /> Visible
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Your profile is listed in search results — <span className="font-semibold text-foreground">free, forever</span>.
          Make sure your profile is complete to appear in seeker searches.
        </p>
        <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground">
            Want to stand out? Use a <span className="font-medium text-foreground">Featured Boost</span> to appear at the top of search results and get hired faster.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelperListingCard;
