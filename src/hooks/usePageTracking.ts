import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const GEO_CACHE_KEY = "ict_geo";
const SESSION_ID_KEY = "ict_sid";

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

export const usePageTracking = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const track = async () => {
      const sessionId = getOrCreateSessionId();
      const geo = await getGeoData();

      await supabase.from("page_visits").insert({
        page: location.pathname,
        ip_address: geo?.ip || null,
        country: geo?.country || null,
        city: geo?.city || null,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        session_id: sessionId,
      });
    };

    if (!isAdmin) track();
  }, [location.pathname]);
};
