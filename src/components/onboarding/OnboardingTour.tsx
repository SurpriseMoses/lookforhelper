import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, MessageSquare, Calendar, Star, ArrowRight, CheckCircle2 } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const SEEKER_STEPS: OnboardingStep[] = [
  {
    title: "Search for Helpers",
    description: "Use filters to find nannies, cleaners, caregivers, and more in your area. Look for verified badges for extra trust.",
    icon: <Search className="h-8 w-8 text-primary" />,
  },
  {
    title: "Send Messages",
    description: "Contact helpers directly through our messaging system. A small subscription unlocks unlimited messaging.",
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
  },
  {
    title: "Schedule Interviews",
    description: "Book video calls or in-person meetings to find the perfect match for your household.",
    icon: <Calendar className="h-8 w-8 text-primary" />,
  },
  {
    title: "Hire with Confidence",
    description: "Review profiles, check references, and verify identity before hiring. Rate your experience to help others.",
    icon: <Star className="h-8 w-8 text-primary" />,
  },
];

const HELPER_STEPS: OnboardingStep[] = [
  {
    title: "Complete Your Profile",
    description: "Add your skills, experience, and a great photo. Profiles with videos get 3x more messages!",
    icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
  },
  {
    title: "Get Discovered",
    description: "Your profile appears in search results. Keep your availability status updated to attract employers.",
    icon: <Search className="h-8 w-8 text-primary" />,
  },
  {
    title: "Respond Quickly",
    description: "Fast response times earn you badges and higher rankings. Check your messages regularly.",
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
  },
  {
    title: "Stand Out",
    description: "Get verified and boost your profile to appear at the top of search results.",
    icon: <Star className="h-8 w-8 text-primary" />,
  },
];

const OnboardingTour = () => {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = role === "helper" ? HELPER_STEPS : SEEKER_STEPS;
  const storageKey = `onboarding_completed_${user?.id}`;

  useEffect(() => {
    if (!user || !role) return;
    
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, role, storageKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true");
    setOpen(false);
  };

  if (!user || !role || role === "admin") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              {steps[currentStep].icon}
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {steps[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep
                  ? "bg-primary"
                  : index < currentStep
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
            Skip tour
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {currentStep < steps.length - 1 ? (
              <>
                Next <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
