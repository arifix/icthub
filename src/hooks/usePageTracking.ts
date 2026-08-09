import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Database } from "../types/supabase";

const GEO_CACHE_KEY = "ict_geo";
const SESSION_ID_KEY = "ict_sid";
const TRACKING_QUEUE_KEY = "ict_tracking_queue";

type ActivityEvent = {
  eventType: string;
  page?: string;
  label?: string | null;
  entityType?: string | null;
  entityId?: string | number | null;
  metadata?: Record<string, unknown> | null;
};

const getOrCreateSessionId = (): string => {
  let sid = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sid);
  }
  return sid;
};

// Cache geo lookup for the whole session — only one API call per visit
const getGeoData = async (): Promise<{
  ip: string;
  country: string;
  city: string;
} | null> => {
  const cached = sessionStorage.getItem(GEO_CACHE_KEY);
  if (cached) return JSON.parse(cached);
  try {
    const res = await fetch("https://ipwho.is/");
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    const geo = {
      ip: data.ip ?? "",
      country: data.country ?? "",
      city: data.city ?? "",
    };
    sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geo));
    return geo;
  } catch {
    return null;
  }
};

const savePendingActivity = (payload: Record<string, unknown>) => {
  try {
    const raw = window.localStorage.getItem(TRACKING_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(queue)) return;
    queue.push(payload);
    window.localStorage.setItem(
      TRACKING_QUEUE_KEY,
      JSON.stringify(queue.slice(-100)),
    );
  } catch (error) {
    console.warn("Unable to save pending analytics activity:", error);
  }
};

const flushPendingActivities = async () => {
  try {
    const raw = window.localStorage.getItem(TRACKING_QUEUE_KEY);
    if (!raw) return;

    const queue = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return;

    const remaining: Record<string, unknown>[] = [];
    for (const item of queue) {
      try {
        const { error } = await supabase
          .from("page_visits")
          .insert([item as never]);
        if (error) {
          remaining.push(item);
          break;
        }
      } catch {
        remaining.push(item);
        break;
      }
    }

    window.localStorage.setItem(
      TRACKING_QUEUE_KEY,
      JSON.stringify(remaining.slice(-100)),
    );
  } catch (error) {
    console.warn("Unable to flush pending analytics activity:", error);
  }
};

export const trackUserActivity = async (event: ActivityEvent) => {
  try {
    const sessionId = getOrCreateSessionId();
    const geo = await getGeoData();

    const payload = {
      page: event.page ?? window.location.pathname,
      event_type: event.eventType,
      event_label: event.label ?? null,
      entity_type: event.entityType ?? null,
      entity_id: event.entityId ? String(event.entityId) : null,
      metadata: (event.metadata ??
        {}) as Database["public"]["Tables"]["page_visits"]["Row"]["metadata"],
      ip_address: geo?.ip || null,
      country: geo?.country || null,
      city: geo?.city || null,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      session_id: sessionId,
    };

    const fallbackPayload = {
      page: payload.page,
      ip_address: payload.ip_address,
      country: payload.country,
      city: payload.city,
      user_agent: payload.user_agent,
      referrer: payload.referrer,
      session_id: payload.session_id,
    };

    const { error } = await supabase
      .from("page_visits")
      .insert([payload as never]);
    if (error) {
      const fallbackResult = await supabase
        .from("page_visits")
        .insert([fallbackPayload as never]);
      if (fallbackResult.error) {
        throw fallbackResult.error;
      }
    }
  } catch (error) {
    console.error("Failed to track user activity:", error);
    savePendingActivity({
      page: event.page ?? window.location.pathname,
      event_type: event.eventType,
      event_label: event.label ?? null,
      entity_type: event.entityType ?? null,
      entity_id: event.entityId ? String(event.entityId) : null,
      metadata: event.metadata ?? {},
      ip_address: null,
      country: null,
      city: null,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      session_id: getOrCreateSessionId(),
    });
  }
};

export const usePageTracking = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    void flushPendingActivities();

    if (!isAdmin) {
      void trackUserActivity({
        eventType: "page_view",
        page: location.pathname,
      });
    }
  }, [isAdmin, location.pathname]);
};
