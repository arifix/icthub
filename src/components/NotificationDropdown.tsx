import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  FileText,
  File,
  Calendar,
  GraduationCap,
  BookOpen,
  Globe,
  CheckCheck,
  X,
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { Database } from "../types/supabase";

type Notification = Database["public"]["Tables"]["notifications"]["Row"] & {
  subjects?: { title: string; code: string } | null;
  semesters: { name: string };
};

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "note":
        return <FileText className="h-4 w-4 text-emerald-600" />;
      case "file":
        return <File className="h-4 w-4 text-purple-600" />;
      case "event":
        return <Calendar className="h-4 w-4 text-amber-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg text-[10px]">
            {unreadCount > 10 ? "10+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-gray-100 z-20 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b-2 border-gray-100 bg-green-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <p className="text-sm text-green-100 font-medium">
                        {unreadCount} unread notification
                        {unreadCount !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className=" text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 px-3 py-1.5 rounded-lg flex items-center font-semibold transition-all duration-200"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 backdrop-blur-sm p-1.5 rounded-lg transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-base text-gray-600 font-medium">
                    No notifications yet
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y-2 divide-gray-100">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      to={getNotificationLink(notification)}
                      onClick={() => handleNotificationClick(notification)}
                      className={`block px-6 py-4 hover:bg-green-50 transition-all duration-200 ${
                        !notification.is_read
                          ? "bg-green-50/50 border-l-4 border-green-600"
                          : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              notification.type === "note"
                                ? "bg-gradient-to-br from-emerald-100 to-green-100"
                                : notification.type === "file"
                                  ? "bg-gradient-to-br from-purple-100 to-fuchsia-100"
                                  : notification.type === "event"
                                    ? "bg-gradient-to-br from-amber-100 to-orange-100"
                                    : "bg-gradient-to-br from-gray-100 to-slate-100"
                            }`}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className={`text-sm font-bold ${
                                !notification.is_read
                                  ? "text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <div className="w-2.5 h-2.5 bg-green-600 rounded-full flex-shrink-0 shadow-lg"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2 font-medium">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {notification.subjects ? (
                                <div className="flex items-center  font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-lg">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  <span>{notification.subjects.title} ({notification.subjects.code})</span>
                                </div>
                              ) : (
                                <div className="flex items-center  font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                                  <Globe className="h-3 w-3 mr-1" />
                                  <span>General</span>
                                </div>
                              )}
                            </div>
                            <span className=" text-gray-500 font-medium">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t-2 border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center justify-center transition-all duration-200"
              >
                View all notifications →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
