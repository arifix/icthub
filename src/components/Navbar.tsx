import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePortalAccess } from "../context/PortalAccessContext";
import {
  BookOpen,
  Calendar,
  FileText,
  Home,
  Menu,
  X,
  Settings,
  LogOut,
  FolderOpen,
  Archive,
  Bell,
  Mail,
  Phone,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/files", label: "Files", icon: FolderOpen },
  { to: "/archive", label: "Archive", icon: Archive },
];

const Navbar: React.FC = () => {
  const { isAdmin, signOut: adminSignOut } = useAuth();
  const { isAuthenticated: isPortalUser, signOut: portalSignOut } = usePortalAccess();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = () => {
    if (isAdmin) adminSignOut();
    else portalSignOut();
    setMenuOpen(false);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "text-white border-b-2 border-white"
        : "text-gray-300 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-kuet-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-9  text-gray-400">
          <span className="font-semibold text-white/70 tracking-wide uppercase text-xs">
            Institute of Information &amp; Communication Technology (IICT) — KUET
          </span>
        </div>
      </div>

      {/* Main nav */}
      <div className="bg-primary-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center border border-white/20">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-white text-base tracking-wide">ICTHub</span>
              <span className="hidden sm:block  text-white/60 leading-none mt-0.5 font-medium">
                M.Sc. ICT Study Portal
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-1">
            {(isPortalUser || isAdmin) && (
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `p-2 rounded transition-colors ${isActive ? "text-accent-500" : "text-white/70 hover:text-white"}`
                }
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
              </NavLink>
            )}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded  font-semibold bg-accent-500 text-white hover:bg-accent-400 transition-colors ml-2"
              >
                <Settings className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
            {(isPortalUser || isAdmin) && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded  font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-primary-800 border-t border-white/10 px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/15 text-accent-500"
                    : "text-gray-200 hover:bg-white/10 hover:text-white"
                }`
              }
              onClick={() => setMenuOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
          <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
            {(isPortalUser || isAdmin) && (
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                    isActive ? "bg-white/15 text-accent-500" : "text-gray-200 hover:bg-white/10 hover:text-white"
                  }`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Bell className="h-4 w-4" />
                Notifications
              </NavLink>
            )}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium text-kuet-dark bg-accent-500 hover:bg-accent-400 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
            {(isPortalUser || isAdmin) && (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium text-red-400 hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;


