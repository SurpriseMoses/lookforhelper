import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";

const mockHelpers = [
  {
    name: "Thandi M.",
    location: "Johannesburg",
    skills: ["Nanny", "Caregiver"],
    experience: 6,
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face",
  },
  {
    name: "Nomsa K.",
    location: "Cape Town",
    skills: ["Cleaner", "Babysitter"],
    experience: 4,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
  },
  {
    name: "Grace L.",
    location: "Durban",
    skills: ["Nanny", "Cleaner"],
    experience: 8,
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
  },
];

const FeaturedHelpers = () => {
  return (
    <section className="bg-secondary/50 py-20 md:py-28">
      <div className="container">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Featured Helpers
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Discover experienced and verified household helpers ready to work.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockHelpers.map((helper, i) => (
            <motion.div
              key={helper.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={helper.image}
                    alt={helper.name}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {helper.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {helper.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {helper.experience} yrs exp
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {helper.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedHelpers;
