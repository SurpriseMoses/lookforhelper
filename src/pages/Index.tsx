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
import SEO from "@/components/SEO";

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
      <SEO
        title="Look For Helper — Find Trusted Domestic Help"
        description="Browse verified domestic helpers — nannies, housekeepers, caregivers and more. Search by city, skills and availability, then connect directly with helpers near you."
        path="/"
      />
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
