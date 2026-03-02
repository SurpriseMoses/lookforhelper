import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t bg-card py-10">
      <div className="container">
        <div className="flex flex-col gap-8">
          {/* Top row */}
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">L</span>
              </div>
              <span className="font-display text-lg font-bold text-foreground">
                Look For Helper
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link to="/browse" className="hover:text-foreground transition-colors">
                Browse Helpers
              </Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
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
                <a href="mailto:support@lookforhelper.co.za" className="text-primary hover:underline">
                  support@lookforhelper.co.za
                </a>
              </span>
              <span className="hidden md:inline">·</span>
              <span>Facebook — <em>Coming Soon</em></span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Look For Helper. All rights reserved.
            </p>
          </div>

          {/* Compliance note */}
          <p className="text-center text-xs text-muted-foreground">
            Look for Helper is currently onboarding early users across South Africa.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
