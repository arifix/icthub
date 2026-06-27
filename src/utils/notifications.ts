import { supabase } from "../lib/supabase";

type NotificationType = "file" | "note" | "event";

interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  related_id: number;
  semester_id: number;
  subject_id?: number;
  created_by: string;
}

export const createNotification = async (
  data: NotificationData
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("notifications").insert({
      type: data.type,
      title: data.title,
      message: data.message,
      related_id: data.related_id,
      semester_id: data.semester_id,
      subject_id: data.subject_id || null,
      created_by: data.created_by,
      is_read: false,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return false;
  }
};

export const markNotificationAsRead = async (
  notificationId: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return false;
  }
};

export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return false;
  }
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Failed to get unread notifications count:", error);
    return 0;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  else if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};
