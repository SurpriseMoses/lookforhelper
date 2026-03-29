import { Check, Sparkles, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserCurrency } from "@/hooks/useUserCurrency";

const PricingSection = () => {
  const { formatAmount } = useUserCurrency();
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Pricing</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Simple, transparent pricing for seekers and helpers.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Seekers */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="h-5 w-5 text-primary" />
                For Seekers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <PriceItem label="Unlock chat & contact with helpers (30 days)" price={`From ${formatAmount(25)}`} />
                <PriceItem label="Keyword search" price="Free" highlight />
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Browsing helpers is always free.
              </p>
            </CardContent>
          </Card>

          {/* Helpers */}
          <Card className="border-2 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                For Helpers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <PriceItem label="30-day free trial after signup" price="Free" highlight />
                <PriceItem label="Profile visibility subscription" price={`${formatAmount(25)}/mo`} />
                <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                  <p className="text-sm font-medium text-foreground">Featured Boost:</p>
                  <PriceItem label="7 days" price={formatAmount(49)} compact />
                  <PriceItem label="21 days" price={formatAmount(99)} compact />
                  <PriceItem label="30 days" price={formatAmount(139)} compact />
                </div>
                <PriceItem label="Verified Identity badge" price={formatAmount(49)} />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-muted-foreground/50" />
                  <span>Background Check — <em>Coming Soon</em></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          All payments activate digital features immediately.
        </p>
      </div>
    </section>
  );
};

const PriceItem = ({
  label,
  price,
  highlight,
  compact,
}: {
  label: string;
  price: string;
  highlight?: boolean;
  compact?: boolean;
}) => (
  <div className={`flex items-center justify-between gap-4 ${compact ? "text-xs" : "text-sm"}`}>
    <span className="flex items-center gap-2 text-muted-foreground">
      <Check className={`${compact ? "h-3 w-3" : "h-4 w-4"} text-primary`} />
      {label}
    </span>
    <span className={`font-semibold whitespace-nowrap ${highlight ? "text-primary" : "text-foreground"}`}>
      {price}
    </span>
  </div>
);

export default PricingSection;
