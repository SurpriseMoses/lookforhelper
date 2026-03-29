import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, MessageSquare, Briefcase, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/browse", icon: Search, label: "Browse" },
  { path: "/jobs", icon: Briefcase, label: "Jobs" },
  { path: "/messages", icon: MessageSquare, label: "Messages", auth: true },
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", auth: true },
];

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleItems = navItems.filter((item) => !item.auth || user);

  // Hide on auth pages
  if (location.pathname.startsWith("/auth")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors min-w-[56px] ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={item.label}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
