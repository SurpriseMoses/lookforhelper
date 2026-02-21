import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, UserPlus, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
  const [totalHires, setTotalHires] = useState(0);

  useEffect(() => {
    const fetchHires = async () => {
      const { count } = await supabase
        .from("hires")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed");
      setTotalHires(count ?? 0);
    };
    fetchHires();
  }, []);

  return (
    <section className="relative overflow-hidden bg-primary py-20 md:py-32">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-accent" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-accent" />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="font-display text-4xl font-extrabold leading-tight text-primary-foreground md:text-6xl">
            Find Trusted{" "}
            <span className="text-accent">Household Help</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-primary-foreground/80">
            Connect with verified nannies, babysitters, cleaners, and caregivers in South Africa. Safe, simple, and professional.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 text-base font-semibold px-8"
              asChild
            >
              <Link to="/browse">
                <Search className="h-5 w-5" />
                Find a Helper
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2 text-base font-semibold px-8"
              asChild
            >
              <Link to="/auth?tab=signup&role=helper">
                <UserPlus className="h-5 w-5" />
                Register as a Helper
              </Link>
            </Button>
          </div>
          {totalHires > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-8 flex items-center justify-center gap-2 text-primary-foreground/70"
            >
              <Briefcase className="h-4 w-4" />
              <span className="text-sm font-medium">
                {totalHires.toLocaleString()} {totalHires === 1 ? "helper" : "helpers"} successfully hired through Look for Helper
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
