import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Footer = () => {
  const { user } = useAuth();
  return (
    <footer className="border-t bg-card py-10">
      <div className="container">
        <div className="flex flex-col gap-8">
          {/* Top row */}
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center">
              <img src={logo} alt="Look For Helper" className="h-8 w-auto" />
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link to="/browse" className="hover:text-foreground transition-colors">
                Browse Helpers
              </Link>
              {!user && (
                <Link to="/auth" className="hover:text-foreground transition-colors">
                  Sign In
                </Link>
              )}
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/refund-policy" className="hover:text-foreground transition-colors">
                Refund Policy
              </Link>
              <Link to="/cancellation-policy" className="hover:text-foreground transition-colors">
                Cancellation Policy
              </Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row border-t pt-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>
                Email:{" "}
                <a href="mailto:help.lookforhelper@gmail.com?subject=General%20Enquiry%20-%20Look%20for%20Helper" className="text-primary hover:underline">
                  help.lookforhelper@gmail.com
                </a>
              </span>
              <span className="hidden md:inline">·</span>
              <a href="https://web.facebook.com/profile.php?id=61588374671149" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Facebook</a>
              <span className="hidden md:inline">·</span>
              <a href="https://www.instagram.com/look_for_helper/?hl=en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Instagram</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Look For Helper (Pty) Ltd. Registration No: 2026/224124/07. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
