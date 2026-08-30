import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  FileText,
  File,
  Calendar,
  CheckCheck,
  ChevronRight,
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { Database } from "../types/supabase";

type Notification = Database["public"]["Tables"]["notifications"]["Row"] & {
  subjects?: { title: string; code: string } | null;
  semesters: { name: string };
};

const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    document.title = "Notifications — ICTHub";
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "note":
        return <FileText className="h-4 w-4 text-[#6b7280]" />;
      case "file":
        return <File className="h-4 w-4 text-[#6b7280]" />;
      case "event":
        return <Calendar className="h-4 w-4 text-[#6b7280]" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case "note":
        return `/notes/${notification.related_id}`;
      case "file":
        return "/files";
      case "event":
        return "/calendar";
      default:
        return "/";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffInDays === 0)
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const typeBadge: Record<string, string> = {
    note: "text-xs bg-blue-400 text-white font-semibold px-1.5 py-0.5 rounded",
    file: "text-xs bg-teal-400 text-white font-semibold px-1.5 py-0.5 rounded",
    event: "text-xs bg-red-400 text-white font-semibold px-1.5 py-0.5 rounded",
  };
  const typeLabel: Record<string, string> = {
    note: "Note",
    file: "File",
    event: "Event",
  };

  return (
    <div className="min-h-[800px] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Page header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mb-1">
            Notifications
          </h1>
          <p className="text-sm text-[#6b7280]">
            Stay updated with the latest notes, files, and events for your
            courses
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              No Notifications
            </h2>
            <p className="text-sm text-gray-500">
              You will see notifications here when new content is added.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {(notifications as Notification[]).map((notification) => (
              <Link
                key={notification.id}
                to={getNotificationLink(notification)}
                onClick={() => {
                  if (!notification.is_read) markAsRead(notification.id);
                }}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 hover:shadow-sm ${
                  !notification.is_read
                    ? "bg-blue-100 border-blue-100 hover:border-blue-200"
                    : "bg-white border-gray-100 hover:border-gray-200"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    !notification.is_read ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={
                        typeBadge[notification.type] ||
                        "text-sm bg-[#f3f4f6] text-[#6b7280] font-semibold px-1.5 py-0.5 rounded"
                      }
                    >
                      {typeLabel[notification.type] || notification.type}
                    </span>
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                    )}
                  </div>
                  <p className="font-semibold text-black truncate">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                    {notification.message} @ {notification.semesters.name}{" "}
                    Semester
                  </p>
                </div>
                <div className="text-sm text-gray-500 shrink-0 text-right">
                  <div>{formatDate(notification.created_at)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
