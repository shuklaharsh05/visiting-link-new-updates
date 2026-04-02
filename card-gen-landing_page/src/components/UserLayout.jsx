import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  LogOut,
  Menu,
  X,
  Bookmark,
  Users,
  KeyRound,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import LinkCredentialsModal from "./LinkCredentialsModal.jsx";

export default function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const needsCredentials = user && (!user.phone || !user.hasPassword);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { path: "/saved-cards", icon: Bookmark, label: "Saved Cards" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/appointments", icon: Calendar, label: "Appointments" },
    { path: "/my-card", icon: CreditCard, label: "My Card" },
    { path: "/contacts", icon: Users, label: "Contacts" },
    {
      path: "/interested-candidates",
      icon: ClipboardList,
      label: "Interested Candidates",
    },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-68 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <a href="/" className="flex items-center gap-2">
              <img src="/visitingLink-logo-white.png" alt="Logo" className="h-8" />
            </a>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 space-y-2">
            {needsCredentials && (
              <button
                onClick={() => setLinkModalOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
              >
                <KeyRound className="w-5 h-5" />
                <span className="font-medium text-left">Link phone & password</span>
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <LinkCredentialsModal isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Desktop UI unchanged: keep sidebar + existing layout.
            Mobile UI: use a fixed bottom navigation (no top bar). */}

        <main className="flex-1 py-4 lg:p-8 pb-24 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom navigation (app-like) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
          <div className="mx-auto max-w-[900px] px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors ${isActivePath("/dashboard")
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Home
              </button>

              <button
                type="button"
                onClick={() => navigate("/my-card")}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors ${isActivePath("/my-card")
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                <CreditCard className="w-5 h-5" />
                Cards
              </button>

              <button
                type="button"
                onClick={() => navigate("/contacts")}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors ${isActivePath("/contacts")
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                <Users className="w-5 h-5" />
                Profile
              </button>

              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors ${sidebarOpen
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                <Menu className="w-5 h-5" />
                More
              </button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
