import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import { readJSON, writeJSON, isNumberArray } from "../lib/storage";
import { useCurrentSemester } from "../hooks/useCurrentSemester";
import type { Tables } from "../types/supabase";

export type PortalNotification = Tables<"notifications"> & {
  subjects: { title: string; code: string } | null;
  semesters: { name: string } | null;
};

type NotificationsContextType = {
  notifications: PortalNotification[];
  unreadCount: number;
  loading: boolean;
  isRead: (notification: PortalNotification) => boolean;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
};

// Read state is per device: one student reading something must not mark it read for everyone.
const READ_IDS_KEY = "icthub_read_notifications";
const READ_BEFORE_KEY = "icthub_notifications_read_before";

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { semester, loading: semesterLoading } = useCurrentSemester();
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<number[]>(() => readJSON(READ_IDS_KEY, [], isNumberArray));
  const [readBefore, setReadBefore] = useState<string>(() => readJSON(READ_BEFORE_KEY, ""));

  const semesterId = semester?.id ?? null;

  const fetchNotifications = useCallback(async () => {
    if (!semesterId) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*, subjects:subject_id (title, code), semesters:semester_id (name)")
      .eq("semester_id", semesterId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) setNotifications((data ?? []) as PortalNotification[]);
    setLoading(false);
  }, [semesterId]);

  useEffect(() => {
    if (semesterLoading) return;
    if (!semesterId) {
      setLoading(false);
      return;
    }
    void fetchNotifications();

    const channel = supabase
      .channel(`notifications:${semesterId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `semester_id=eq.${semesterId}` },
        () => void fetchNotifications(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [semesterId, semesterLoading, fetchNotifications]);

  const isRead = useCallback(
    (notification: PortalNotification) =>
      (readBefore !== "" && notification.created_at <= readBefore) || readIds.includes(notification.id),
    [readBefore, readIds],
  );

  const markAsRead = useCallback((id: number) => {
    setReadIds((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id].slice(-200);
      writeJSON(READ_IDS_KEY, next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const newest = notifications[0]?.created_at;
    if (!newest) return;
    setReadBefore(newest);
    writeJSON(READ_BEFORE_KEY, newest);
    setReadIds([]);
    writeJSON(READ_IDS_KEY, []);
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !isRead(n)).length,
    [notifications, isRead],
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, isRead, markAsRead, markAllAsRead }),
    [notifications, unreadCount, loading, isRead, markAsRead, markAllAsRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within NotificationsProvider");
  return context;
};
