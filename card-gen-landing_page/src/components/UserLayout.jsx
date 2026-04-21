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
  Star,
  ShoppingBag,
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
    { path: "/shop", icon: ShoppingBag, label: "Shop" },
    { path: "/saved-cards", icon: Bookmark, label: "Saved Cards" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/appointments", icon: Calendar, label: "Appointments" },
    { path: "/reviews", icon: Star, label: "Reviews" },
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

      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        {/* Desktop UI unchanged: keep sidebar + existing layout.
            Mobile UI: use a fixed bottom navigation (no top bar). */}

        <main className="flex-1 md:py-4 bg-white lg:p-8 pb-24 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom navigation (app-like) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="mx-auto max-w-[500px] px-4 py-3">
            <div className="grid grid-cols-5 gap-1">
              <button
                type="button"
                onClick={() => navigate("/my-card")}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[10px] font-semibold transition-all duration-300 ${isActivePath("/my-card")
                  ? "bg-gradient-to-b from-[#f8faff] to-[#e8efff] text-blue-600 shadow-sm border border-blue-50/50"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                <img src="/bottom_bar_1.png" alt="My Cards" className="w-6 h-6 object-contain" />
                <span>My Cards</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/reviews")}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[10px] font-semibold transition-all duration-300 ${isActivePath("/reviews")
                  ? "bg-gradient-to-b from-[#f8faff] to-[#e8efff] text-blue-600 shadow-sm border border-blue-50/50"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                <img src="/bottom_bar_rev.png" alt="Reviews" className="w-6 h-6 object-contain" />
                <span>Reviews</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/shop")}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[10px] font-semibold transition-all duration-300 ${isActivePath("/shop")
                  ? "bg-gradient-to-b from-[#f8faff] to-[#e8efff] text-blue-600 shadow-sm border border-blue-50/50"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                <img src="/bottom_bar_2.png" alt="Shop" className="w-6 h-6 object-contain" />
                <span>Shop</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/appointments")}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[10px] font-semibold transition-all duration-300 ${isActivePath("/appointments")
                  ? "bg-gradient-to-b from-[#f8faff] to-[#e8efff] text-blue-600 shadow-sm border border-blue-50/50"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                <img src="/bottom_bar_3.png" alt="Message" className="w-6 h-6 object-contain" />
                <span>Messages</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[10px] font-semibold transition-all duration-300 ${isActivePath("/dashboard")
                  ? "bg-gradient-to-b from-[#f8faff] to-[#e8efff] text-blue-600 shadow-sm border border-blue-50/50"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                <img src="/bottom_bar_4.png" alt="Analytics" className="w-6 h-6 object-contain" />
                <span>Analytics</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
