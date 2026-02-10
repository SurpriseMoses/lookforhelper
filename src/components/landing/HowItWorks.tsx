import { Search, MessageSquare, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Search,
    title: "Browse",
    description: "Search through verified helper profiles. Filter by skills, location, experience, and more.",
  },
  {
    icon: MessageSquare,
    title: "Connect",
    description: "View detailed profiles and connect with helpers that match your household needs.",
  },
  {
    icon: CheckCircle,
    title: "Hire",
    description: "Interview, verify references, and hire with confidence through our trusted platform.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Finding the right household help is easy with Look For Helper.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="group text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <step.icon className="h-8 w-8" />
              </div>
              <div className="mx-auto mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
