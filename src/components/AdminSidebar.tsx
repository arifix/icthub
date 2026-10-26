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
  Activity,
  Info,
  MessageSquare,
} from "lucide-react";
import icthub from "../assets/icthub.png";

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
    {
      to: "/admin/dashboard",
      label: "Dashboard",
      icon: BarChart3,
      description: "Overview",
    },
    {
      to: "/admin/semesters",
      label: "Semesters",
      icon: Calendar,
      description: "Academic Terms",
      matchPaths: ["/admin/semesters/"],
    },
    {
      to: "/admin/subjects",
      label: "Subjects",
      icon: BookOpen,
      description: "Manage Courses",
      matchPaths: ["/admin/subjects/"],
    },
    {
      to: "/admin/notes",
      label: "Notes",
      icon: FileText,
      description: "Study Materials",
      matchPaths: ["/admin/notes/"],
    },
    {
      to: "/admin/info-notes",
      label: "Information",
      icon: Info,
      description: "Tips & Guidance",
      matchPaths: ["/admin/info-notes/", "/admin/info-categories"],
    },
    {
      to: "/admin/calendar",
      label: "Calendar",
      icon: Calendar,
      description: "Events & Schedule",
      matchPaths: ["/admin/events/"],
    },
    {
      to: "/admin/files",
      label: "Files",
      icon: File,
      description: "Resources & Docs",
      matchPaths: ["/admin/files/"],
    },
    {
      to: "/admin/comments",
      label: "Comments",
      icon: MessageSquare,
      description: "Moderation",
    },
    {
      to: "/admin/analytics",
      label: "Analytics",
      icon: Activity,
      description: "Visitor Tracking",
    },
    {
      to: "/admin/settings",
      label: "Settings",
      icon: Settings,
      description: "Portal Access",
    },
  ];

  const isActiveRoute = (item: (typeof navigationItems)[0]) => {
    if (location.pathname === item.to) return true;
    if (item.matchPaths) {
      return item.matchPaths.some((path) => location.pathname.includes(path));
    }
    return false;
  };

  const activeClass = `flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-700 transition-all duration-200 group`;
  const inactiveClass = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group`;

  return (
    <aside
      className={`admin-sidebar bg-white border-r border-slate-200 transition-all duration-300 ${
        collapsed ? "w-[76px]" : "w-[252px]"
      } flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100 min-h-[86px]">
        {!collapsed && (
          <div className="flex items-center gap-1">
            <img src={icthub} alt="ICTHub Logo" className="w-[44px] h-[44px] object-contain" />
            <div>
              <h1 className="font-bold text-slate-900 tracking-tight">ICTHub</h1>
              <p className="text-xs text-slate-500">Admin workspace</p>
            </div>
          </div>
        )}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all duration-200`}
          onClick={toggleSidebar}
        >
          {collapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {!collapsed && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>}
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
                  size={18}
                  className={
                    isActive
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-blue-600"
                  }
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
      <div className="p-3 border-t border-slate-100 space-y-1">
        <Link
          to="/"
          className={`${inactiveClass} ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "View Portal" : undefined}
        >
          <Globe
            size={18}
            className="text-gray-400 group-hover:text-blue-600 shrink-0"
          />
          {!collapsed && (
            <span className="text-sm font-medium">View Portal</span>
          )}
        </Link>

        <button
          onClick={handleSignOut}
          className={`w-full text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-all duration-200 flex items-center gap-3 px-3 py-2.5 rounded-xl ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
