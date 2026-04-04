import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu, X, MessageSquare, Calendar, Shield, Briefcase } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Look For Helper" className="h-14 w-auto" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/browse">Browse Helpers</Link>
          </Button>
          <Button variant="ghost" asChild className="gap-1.5">
            <Link to="/jobs"><Briefcase className="h-4 w-4" /> Jobs</Link>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" asChild className="gap-1.5">
                <Link to="/messages"><MessageSquare className="h-4 w-4" /> Messages</Link>
              </Button>
              <Button variant="ghost" asChild className="gap-1.5">
                <Link to="/interviews"><Calendar className="h-4 w-4" /> Interviews</Link>
              </Button>
              <NotificationBell />
              <Button variant="outline" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              {role === "admin" && (
                <Button variant="ghost" asChild className="gap-1.5">
                  <Link to="/admin"><Shield className="h-4 w-4" /> Admin</Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/auth">Log In</Link>
              </Button>
              <Button asChild>
                <Link to="/auth?tab=signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Button variant="ghost" asChild className="justify-start">
              <Link to="/browse" onClick={() => setMobileOpen(false)}>Browse Helpers</Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start gap-1.5">
              <Link to="/jobs" onClick={() => setMobileOpen(false)}><Briefcase className="h-4 w-4" /> Jobs</Link>
            </Button>
            {user ? (
              <>
                <Button variant="ghost" asChild className="justify-start gap-1.5">
                  <Link to="/messages" onClick={() => setMobileOpen(false)}><MessageSquare className="h-4 w-4" /> Messages</Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start gap-1.5">
                  <Link to="/interviews" onClick={() => setMobileOpen(false)}><Calendar className="h-4 w-4" /> Interviews</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                </Button>
                {role === "admin" && (
                  <Button variant="ghost" asChild className="justify-start gap-1.5">
                    <Link to="/admin" onClick={() => setMobileOpen(false)}><Shield className="h-4 w-4" /> Admin</Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>Log In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth?tab=signup" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
