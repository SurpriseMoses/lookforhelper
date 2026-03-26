import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustSection from "@/components/landing/TrustSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturedHelpers from "@/components/landing/FeaturedHelpers";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const [searchParams] = useSearchParams();

  // Capture referral code from URL so it persists through navigation
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("pending_referral_code", ref.trim().toUpperCase());
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <TrustSection />
        <HowItWorks />
        <FeaturedHelpers />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
