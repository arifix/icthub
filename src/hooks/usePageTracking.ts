import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { readJSON, writeJSON } from "../lib/storage";
import type { Database, Json } from "../types/supabase";

type VisitInsert = Database["public"]["Tables"]["page_visits"]["Insert"];

const GEO_CACHE_KEY = "ict_geo";
const SESSION_ID_KEY = "ict_sid";
const QUEUE_KEY = "ict_tracking_queue";

type ActivityEvent = {
  eventType: string;
  page?: string;
  label?: string | null;
  entityType?: string | null;
  entityId?: string | number | null;
  metadata?: Record<string, Json> | null;
};

const sessionId = (): string => {
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return "unknown";
  }
};

type Geo = { ip: string; country: string; city: string };

// One geo lookup per browser session.
let geoPromise: Promise<Geo | null> | null = null;
const geo = (): Promise<Geo | null> => {
  geoPromise ??= (async () => {
    try {
      const cached = sessionStorage.getItem(GEO_CACHE_KEY);
      if (cached) return JSON.parse(cached) as Geo;
      const res = await fetch("https://ipwho.is/?fields=success,ip,country,city");
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.success) return null;
      const value = { ip: String(data.ip ?? ""), country: String(data.country ?? ""), city: String(data.city ?? "") };
      sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(value));
      return value;
    } catch {
      return null;
    }
  })();
  return geoPromise;
};

const enqueue = (payload: VisitInsert) => {
  const queue = readJSON<VisitInsert[]>(QUEUE_KEY, [], Array.isArray);
  writeJSON(QUEUE_KEY, [...queue, payload].slice(-50));
};

let flushing = false;
const flushQueue = async () => {
  if (flushing) return;
  const queue = readJSON<VisitInsert[]>(QUEUE_KEY, [], Array.isArray);
  if (!queue.length) return;
  flushing = true;
  const { error } = await supabase.from("page_visits").insert(queue);
  if (!error) writeJSON(QUEUE_KEY, []);
  flushing = false;
};

/** Records a student activity. Identity (user, student name) is attached server-side. */
export const trackUserActivity = async (event: ActivityEvent) => {
  const location = await geo();
  const payload: VisitInsert = {
    page: event.page ?? window.location.pathname,
    event_type: event.eventType,
    event_label: event.label ?? null,
    entity_type: event.entityType ?? null,
    entity_id: event.entityId != null ? String(event.entityId) : null,
    metadata: event.metadata ?? {},
    ip_address: location?.ip || null,
    country: location?.country || null,
    city: location?.city || null,
    user_agent: navigator.userAgent,
    referrer: document.referrer || null,
    session_id: sessionId(),
  };
  const { error } = await supabase.from("page_visits").insert(payload);
  if (error) enqueue(payload);
};

export const usePageTracking = () => {
  const { isAdmin, hasPortalAccess } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    if (isAdmin || !hasPortalAccess) return;
    void flushQueue();
    void trackUserActivity({ eventType: "page_view", page: pathname });
  }, [isAdmin, hasPortalAccess, pathname]);
};

/** Tracks only for students; admins browsing the portal are not counted. */
export const useTrack = () => {
  const { isAdmin } = useAuth();
  return (event: ActivityEvent) => {
    if (!isAdmin) void trackUserActivity(event);
  };
};
