import React, { useEffect, useState } from "react";
import {
  Activity,
  Globe,
  Monitor,
  Navigation,
  Smartphone,
  TrendingUp,
  Users,
  Eye,
  MapPin,
  Clock,
  FileText,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type Visit = {
  id: number;
  created_at: string;
  page: string;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  user_agent: string | null;
  referrer: string | null;
  session_id: string | null;
};

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/subjects": "Subjects",
  "/notes": "Notes",
  "/calendar": "Calendar",
  "/files": "Files",
  "/archive": "Archive",
  "/notifications": "Notifications",
};

const getPageLabel = (path: string) => {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith("/notes/")) return "Note Detail";
  if (path.startsWith("/subjects/")) return "Subject Detail";
  return path;
};

const isMobile = (ua: string | null) =>
  ua
    ? /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    : false;

const startOfDay = (d = new Date()) => {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
};

const AdminAnalytics: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today" | "week" | "month" | "all">(
    "today",
  );

  useEffect(() => {
    document.title = "Analytics — ICTHub Admin";
    fetchVisits();
  }, [range]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("page_visits")
        .select("*")
        .order("created_at", { ascending: false });

      if (range !== "all") {
        const now = new Date();
        let from: Date;
        if (range === "today") from = startOfDay(now);
        else if (range === "week") {
          from = new Date(now);
          from.setDate(now.getDate() - 7);
        } else {
          from = new Date(now);
          from.setDate(now.getDate() - 30);
        }
        query = query.gte("created_at", from.toISOString());
      }

      const { data, error } = await query.limit(2000);
      if (error) throw error;
      setVisits(data || []);
    } catch (err) {
      console.error("Failed to fetch visits:", err);
    } finally {
      setLoading(false);
    }
  };

  // Aggregations
  const todayVisits = visits.filter(
    (v) => new Date(v.created_at) >= startOfDay(),
  ).length;

  const uniqueSessions = new Set(
    visits.map((v) => v.session_id).filter(Boolean),
  ).size;
  const uniqueIPs = new Set(visits.map((v) => v.ip_address).filter(Boolean))
    .size;

  const mobileCount = visits.filter((v) => isMobile(v.user_agent)).length;
  const desktopCount = visits.length - mobileCount;

  const pageCounts = visits.reduce<Record<string, number>>((acc, v) => {
    const label = getPageLabel(v.page);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const countryCounts = visits.reduce<Record<string, number>>((acc, v) => {
    const c = v.country || "Unknown";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxPageCount = topPages[0]?.[1] || 1;
  const maxCountryCount = topCountries[0]?.[1] || 1;

  // Group visits by session for user journey view
  const sessionJourneys = Object.entries(
    visits.reduce<Record<string, Visit[]>>((acc, v) => {
      const key = v.session_id ?? `_${v.id}`;
      (acc[key] = acc[key] || []).push(v);
      return acc;
    }, {}),
  )
    .map(([sid, svs]) => ({
      sid,
      pages: [...svs].sort(
        (a, b) => +new Date(a.created_at) - +new Date(b.created_at),
      ),
    }))
    .sort(
      (a, b) =>
        +new Date(b.pages[b.pages.length - 1].created_at) -
        +new Date(a.pages[a.pages.length - 1].created_at),
    )
    .slice(0, 25);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              Analytics
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">Visitor tracking</p>
          </div>
          <div className="flex gap-2">
            {(["today", "week", "month", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  range === r
                    ? "bg-black text-white"
                    : "bg-white border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                {r === "all"
                  ? "All time"
                  : r === "today"
                    ? "Today"
                    : r === "week"
                      ? "7 days"
                      : "30 days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Page Views",
                  value: visits.length,
                  icon: Eye,
                  sub: `${todayVisits} today`,
                },
                {
                  label: "Unique Sessions",
                  value: uniqueSessions,
                  icon: Users,
                  sub: "browser sessions",
                },
                {
                  label: "Unique IPs",
                  value: uniqueIPs,
                  icon: Globe,
                  sub: "distinct visitors",
                },
                {
                  label: "Mobile / Desktop",
                  value: `${mobileCount} / ${desktopCount}`,
                  icon: Smartphone,
                  sub: "device split",
                },
              ].map(({ label, value, icon: Icon, sub }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl border border-[#e5e7eb] p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                      {label}
                    </p>
                    <div className="bg-[#f3f4f6] p-1.5 rounded-lg">
                      <Icon className="h-4 w-4 text-[#374151]" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-black">{value}</p>
                  <p className="text-xs text-gray-500] mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* Top pages + Top countries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Pages */}
              <div className="bg-white rounded-xl border border-[#e5e7eb]">
                <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#374151]" />
                  <span className="text-sm font-bold text-black">
                    Top Pages
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {topPages.length === 0 ? (
                    <p className="text-sm text-gray-500] text-center py-4">
                      No data
                    </p>
                  ) : (
                    topPages.map(([page, count]) => (
                      <div key={page}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#374151] truncate">
                            {page}
                          </span>
                          <span className="text-sm font-bold text-black ml-2 shrink-0">
                            {count}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-black rounded-full"
                            style={{
                              width: `${(count / maxPageCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Countries */}
              <div className="bg-white rounded-xl border border-[#e5e7eb]">
                <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#374151]" />
                  <span className="text-sm font-bold text-black">
                    Top Countries
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {topCountries.length === 0 ? (
                    <p className="text-sm text-gray-500] text-center py-4">
                      No data
                    </p>
                  ) : (
                    topCountries.map(([country, count]) => (
                      <div key={country}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#374151] truncate">
                            {country}
                          </span>
                          <span className="text-sm font-bold text-black ml-2 shrink-0">
                            {count}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-black rounded-full"
                            style={{
                              width: `${(count / maxCountryCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* User Session Journeys */}
            <div className="bg-white rounded-xl border border-[#e5e7eb]">
              <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-[#374151]" />
                <span className="text-sm font-bold text-black">
                  User Journeys
                </span>
                <span className="ml-auto text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                  {sessionJourneys.length} sessions
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      {[
                        "Session",
                        "Started",
                        "Location",
                        "Device",
                        "Page Flow",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {sessionJourneys.map(({ sid, pages }) => {
                      const first = pages[0];
                      const ip = first.ip_address;
                      const location = [first.city, first.country]
                        .filter(Boolean)
                        .join(", ");
                      const mobile = isMobile(first.user_agent);
                      const isAnon = sid.startsWith("_");
                      return (
                        <tr key={sid} className="hover:bg-[#f9fafb]">
                          <td className="px-5 py-3">
                            <span className="font-mono text-xs text-gray-500]">
                              {isAnon ? "—" : sid.slice(0, 8) + "…"}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              {pages.length}p
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[#6b7280] whitespace-nowrap text-xs">
                            {formatTime(first.created_at)}
                          </td>
                          <td className="px-5 py-3 text-xs">
                            <div className="font-mono text-[#6b7280]">
                              {ip || "—"}
                            </div>
                            <div className="text-gray-500]">
                              {location || "—"}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1 text-[#6b7280]">
                              {mobile ? (
                                <Smartphone className="h-3.5 w-3.5" />
                              ) : (
                                <Monitor className="h-3.5 w-3.5" />
                              )}
                              <span className="text-xs">
                                {mobile ? "Mobile" : "Desktop"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {pages.slice(0, 6).map((p, i) => (
                                <React.Fragment key={p.id}>
                                  {i > 0 && (
                                    <span className="text-gray-500 text-xs select-none">
                                      →
                                    </span>
                                  )}
                                  <span className="text-xs bg-[#f3f4f6] text-[#374151] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                                    {getPageLabel(p.page)}
                                  </span>
                                </React.Fragment>
                              ))}
                              {pages.length > 6 && (
                                <span className="text-xs text-gray-500]">
                                  +{pages.length - 6} more
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {sessionJourneys.length === 0 && (
                  <div className="text-center py-12 text-gray-500] text-sm">
                    No sessions recorded yet
                  </div>
                )}
              </div>
            </div>

            {/* Recent visits table */}
            <div className="bg-white rounded-xl border border-[#e5e7eb]">
              <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#374151]" />
                <span className="text-sm font-bold text-black">
                  Recent Visits
                </span>
                <span className="ml-auto text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                  {visits.length} total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      {["Time", "Page", "IP", "Location", "Device"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {visits.slice(0, 30).map((v) => (
                      <tr key={v.id} className="hover:bg-[#f9fafb]">
                        <td className="px-5 py-3 text-[#6b7280] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 shrink-0" />
                            {formatTime(v.created_at)}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3 w-3 text-gray-500] shrink-0" />
                            <span className="font-medium text-[#374151]">
                              {getPageLabel(v.page)}
                            </span>
                            <span className="text-gray-500] text-xs">
                              {v.page}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-[#6b7280]">
                          {v.ip_address || "—"}
                        </td>
                        <td className="px-5 py-3 text-[#374151]">
                          {[v.city, v.country].filter(Boolean).join(", ") ||
                            "—"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 text-[#6b7280]">
                            {isMobile(v.user_agent) ? (
                              <Smartphone className="h-3.5 w-3.5" />
                            ) : (
                              <Monitor className="h-3.5 w-3.5" />
                            )}
                            <span className="text-xs">
                              {isMobile(v.user_agent) ? "Mobile" : "Desktop"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visits.length === 0 && (
                  <div className="text-center py-12 text-gray-500] text-sm">
                    No visits recorded yet
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
