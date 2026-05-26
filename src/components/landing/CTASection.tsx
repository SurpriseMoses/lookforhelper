import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, UserPlus } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl rounded-2xl bg-primary px-8 py-14 text-center md:px-16">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-primary-foreground/80">
            Whether you're looking for help or looking for work, join thousands of individuals on Look For Helper.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 font-semibold px-8"
              onClick={() => navigate("/browse")}
            >
              <Search className="h-4 w-4" />
              Find a Helper
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2 font-semibold px-8"
              onClick={() => navigate("/auth?tab=signup&role=helper")}
            >
              <UserPlus className="h-4 w-4" />
              Register as a Helper
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
