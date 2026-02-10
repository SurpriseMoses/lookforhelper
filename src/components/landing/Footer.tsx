import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t bg-card py-10">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">L</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              Look For Helper
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/browse" className="hover:text-foreground transition-colors">
              Browse Helpers
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Look For Helper. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
