import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, FileText, File, Calendar, CheckCheck, ChevronRight } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { Database } from "../types/supabase";

type Notification = Database["public"]["Tables"]["notifications"]["Row"] & {
  subjects?: { title: string; code: string } | null;
  semesters: { name: string };
};

const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    document.title = "Notifications — ICTHub";
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "note": return <FileText className="h-4 w-4 text-primary-700" />;
      case "file": return <File className="h-4 w-4 text-teal-600" />;
      case "event": return <Calendar className="h-4 w-4 text-amber-600" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case "note": return `/notes/${notification.related_id}`;
      case "file": return "/files";
      case "event": return "/calendar";
      default: return "/";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const typeBadge: Record<string, string> = {
    note: "bg-primary-50 text-primary-700",
    file: "bg-teal-50 text-teal-700",
    event: "bg-amber-50 text-amber-700",
  };
  const typeLabel: Record<string, string> = { note: "Note", file: "File", event: "Event" };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Notifications</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-accent-500 text-sm mt-1 font-semibold">
                  {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white text-sm font-semibold rounded hover:bg-accent-400 transition-colors shrink-0"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-700 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">No Notifications</h2>
            <p className="text-sm text-gray-500">You will see notifications here when new content is added.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(notifications as Notification[]).map((notification) => (
              <Link
                key={notification.id}
                to={getNotificationLink(notification)}
                onClick={() => { if (!notification.is_read) markAsRead(notification.id); }}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                  !notification.is_read
                    ? "bg-primary-50 border-primary-200 hover:border-primary-300"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  !notification.is_read ? "bg-primary-100" : "bg-gray-100"
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={` font-bold uppercase px-1.5 py-0.5 rounded ${typeBadge[notification.type] || "bg-gray-100 text-gray-600"}`}>
                      {typeLabel[notification.type] || notification.type}
                    </span>
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary-700 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
                  <p className=" text-gray-500 mt-0.5 line-clamp-1">{notification.message}</p>
                </div>
                <div className=" text-gray-400 shrink-0 text-right">
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
