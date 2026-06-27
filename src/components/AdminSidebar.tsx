import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  LogOut,
  File,
  BarChart3,
  Globe,
  Settings,
} from "lucide-react";

const AdminSidebar: React.FC = () => {
  const { signOut: adminSignOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  useEffect(() => {
    const handleResize = () => setCollapsed(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = () => adminSignOut();

  const navigationItems = [
    { to: "/admin/dashboard",  label: "Dashboard",  icon: BarChart3,    description: "Overview" },
    { to: "/admin/semesters",  label: "Semesters",  icon: Calendar,     description: "Academic Terms",       matchPaths: ["/admin/semesters/"] },
    { to: "/admin/subjects",   label: "Subjects",   icon: BookOpen,     description: "Manage Courses",        matchPaths: ["/admin/subjects/"] },
    { to: "/admin/notes",      label: "Notes",      icon: FileText,     description: "Study Materials",       matchPaths: ["/admin/notes/"] },
    { to: "/admin/calendar",   label: "Calendar",   icon: Calendar,     description: "Events & Schedule",     matchPaths: ["/admin/events/"] },
    { to: "/admin/files",      label: "Files",      icon: File,         description: "Resources & Docs",      matchPaths: ["/admin/files/"] },
    { to: "/admin/settings",   label: "Settings",   icon: Settings,     description: "Portal Password" },
  ];

  const isActiveRoute = (item: (typeof navigationItems)[0]) => {
    if (location.pathname === item.to) return true;
    if (item.matchPaths) {
      return item.matchPaths.some((path) => location.pathname.includes(path));
    }
    return false;
  };

  const activeClass = `flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary-700 text-white shadow-sm transition-all duration-200`;
  const inactiveClass = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 group`;

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      } flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-kuet-dark border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="bg-primary-700 p-1.5 rounded-md border border-primary-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">ICTHub</h1>
              <p className=" text-gray-400">Admin Panel</p>
            </div>
          </div>
        )}
        <button
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
          onClick={toggleSidebar}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navigationItems.map((item) => {
          const isActive = isActiveRoute(item);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={isActive ? activeClass : inactiveClass}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex-shrink-0">
                <item.icon
                  size={17}
                  className={isActive ? "text-white" : "text-gray-400 group-hover:text-primary-700"}
                />
              </div>
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-100 space-y-0.5">
        <Link
          to="/"
          className={`${inactiveClass} ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "View Portal" : undefined}
        >
          <Globe size={17} className="text-gray-400 group-hover:text-primary-700 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">View Portal</span>}
        </Link>

        <button
          onClick={handleSignOut}
          className={`w-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 flex items-center gap-3 px-3 py-2.5 rounded-lg ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

