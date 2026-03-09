import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SeekerSubscriptionProvider } from "@/contexts/SeekerSubscriptionContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Browse from "./pages/Browse";
import Dashboard from "./pages/Dashboard";
import HelperProfile from "./pages/HelperProfile";
import AuthCallback from "./pages/AuthCallback";
import CompleteProfile from "./pages/CompleteProfile";
import NotFound from "./pages/NotFound";
import Messages from "./pages/Messages";
import Interviews from "./pages/Interviews";
import AdminDashboard from "./pages/AdminDashboard";
import HireDetails from "./pages/HireDetails";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import CancellationPolicy from "./pages/CancellationPolicy";
import Contact from "./pages/Contact";
import ResetPassword from "./pages/ResetPassword";
import SavedHelpers from "./pages/SavedHelpers";
import BottomNav from "./components/mobile/BottomNav";
import OnboardingTour from "./components/onboarding/OnboardingTour";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SeekerSubscriptionProvider>
            <div className="pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/helper/:userId" element={<HelperProfile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/interviews" element={<Interviews />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/hire/:hireId" element={<HireDetails />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/cancellation-policy" element={<CancellationPolicy />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/saved-helpers" element={<SavedHelpers />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <BottomNav />
            <OnboardingTour />
          </SeekerSubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
