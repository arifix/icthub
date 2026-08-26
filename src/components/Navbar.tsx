import React, { useState, useEffect, useRef } from "react";
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
  Info,
  Settings,
  LogOut,
  FolderOpen,
  Archive,
  Bell,
  Shield,
  ChevronDown,
  Users,
  School,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/files", label: "Files", icon: FolderOpen },
  //{ to: "/archive", label: "Archive", icon: Archive },
  { to: "/information", label: "Information", icon: Info },
  //{ to: "/club", label: "IICT Club", icon: Users },
];

const Navbar: React.FC = () => {
  const { isAdmin, signOut: adminSignOut } = useAuth();
  const { isAuthenticated: isPortalUser, signOut: portalSignOut } =
    usePortalAccess();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = () => {
    if (isAdmin) adminSignOut();
    else portalSignOut();
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const isAuthenticated = isPortalUser || isAdmin;

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <School className="h-10 w-10 text-gray-800" />
            <div className="ml-3">
              <span className="text-xl font-bold text-gray-800">ICTHub</span>
              <p className="text-xs text-gray-600 leading-none mt-0.5">
                M.Sc. Eng. in ICT Study Portal
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 text-sm ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right */}
          <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-gray-200">
            {isAuthenticated && (
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `p-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-blue-100 hover:text-blue-600 bg-blue-50"
                  }`
                }
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
              </NavLink>
            )}

            {isAuthenticated && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                    {isAdmin ? (
                      <Shield className="h-4 w-4 text-white" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-sm font-semibold text-gray-900">
                      {isAdmin ? "Admin" : "Student"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isAdmin ? "Administrator" : "IICT, KUET"}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors mx-1 rounded-xl"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Settings className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Admin Panel</span>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors mx-1 rounded-xl"
                      style={{ width: "calc(100% - 8px)" }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                }`
              }
              onClick={() => setMenuOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {isAuthenticated && (
            <div className="pt-2 mt-2 border-t border-gray-100 space-y-1">
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-600 bg-blue-50"
                  }`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </NavLink>
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
