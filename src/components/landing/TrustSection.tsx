import { ShieldCheck, Heart, Zap } from "lucide-react";
import { motion } from "framer-motion";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Identity Verified Profiles",
    description:
      "Every helper and employer can verify their identity through our secure document & selfie process.",
  },
  {
    icon: Heart,
    title: "Safe & Trusted Platform",
    description:
      "Built-in reporting, dispute resolution, and moderated conversations keep everyone protected.",
  },
  {
    icon: Zap,
    title: "Easy Hiring Process",
    description:
      "Browse, message, interview and hire — all in one place with simple, transparent pricing.",
  },
];

const TrustSection = () => {
  return (
    <section className="bg-secondary py-20 md:py-28">
      <div className="container">
        <div className="text-center">
          <p className="mx-auto max-w-lg text-lg font-medium text-foreground">
            We make finding and hiring household help safe, simple, and
            professional.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {trustItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
