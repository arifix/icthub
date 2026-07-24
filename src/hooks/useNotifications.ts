import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import { useSemesterData } from "./useSemesterData";

type Notification = Database["public"]["Tables"]["notifications"]["Row"] & {
  subjects?: { title: string; code: string } | null;
  semesters: { name: string };
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentSemester, loading: semesterLoading } = useSemesterData();

  useEffect(() => {
    // Wait until semester data has finished loading
    if (semesterLoading) return;

    // No current semester — nothing to load
    if (!currentSemester) {
      setLoading(false);
      return;
    }

    fetchNotifications();
    const cleanup = subscribeToNotifications();
    return cleanup;
  }, [currentSemester, semesterLoading]);

  const fetchNotifications = async () => {
    if (!currentSemester) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          *,
          subjects:subject_id (title, code),
          semesters:semester_id (name)
        `,
        )
        .eq("semester_id", currentSemester.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!currentSemester) return;

    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `semester_id=eq.${currentSemester.id}`,
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentSemester) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("semester_id", currentSemester.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
