import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Globe,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";

type Event = Database["public"]["Tables"]["events"]["Row"] & {
  subjects?: { title: string; code: string } | null;
};

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("events")
          .select(
            `*, subjects:subject_id (title, code), semester:semesters!inner(id, name, is_current)`,
          )
          .eq("is_active", true)
          .eq("semester.is_current", true)
          .order("date", { ascending: true });
        if (error) throw error;
        setEvents(data || []);
        document.title = "Academic Calendar — ICTHub";
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysCount = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const days: any[] = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: 0, date: null });
    for (let i = 1; i <= daysCount; i++) {
      const date = new Date(year, month, i);
      const localDate = new Date(date.getTime() + 6 * 60 * 60 * 1000);
      const dateString = localDate.toISOString().split("T")[0];
      days.push({
        day: i,
        date,
        dateString,
        events: events.filter((e) => e.date === dateString),
      });
    }
    return days;
  };

  const isToday = (date: Date) => {
    const t = new Date();
    return (
      date.getDate() === t.getDate() &&
      date.getMonth() === t.getMonth() &&
      date.getFullYear() === t.getFullYear()
    );
  };

  const calendarDays = generateCalendarDays();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = events.filter((e) => e.date >= today);

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Page header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mb-1">
            Academic Calendar
          </h1>
          <p className="text-sm text-[#6b7280]">
            Events, schedules and important dates
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                <h2 className="text-sm font-bold text-black">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1.5 text-xs font-semibold bg-black text-white rounded-xl hover:bg-[#374151] transition-all"
                  >
                    Today
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1,
                          1,
                        ),
                      )
                    }
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-7 mb-2">
                    {weekdays.map((day, i) => (
                      <div
                        key={day}
                        className={`text-center text-xs font-semibold py-2 ${i >= 5 ? "text-red-500" : "text-[#6b7280]"}`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      const isWeekend =
                        day.date &&
                        (day.date.getDay() === 5 || day.date.getDay() === 6);
                      return (
                        <div
                          key={index}
                          className={`min-h-16 rounded p-1 ${
                            day.day === 0
                              ? "bg-transparent"
                              : day.date && isToday(day.date)
                                ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl"
                                : isWeekend
                                  ? "bg-red-50 hover:bg-red-100/60 border border-red-100 rounded-lg"
                                  : "bg-white hover:bg-blue-50 border border-gray-100 rounded-lg"
                          }`}
                        >
                          {day.day > 0 && (
                            <>
                              <div
                                className={`text-right mb-1 font-semibold ${
                                  day.date && isToday(day.date)
                                    ? "text-white"
                                    : isWeekend
                                      ? "text-red-500"
                                      : "text-gray-700"
                                }`}
                              >
                                {day.day}
                              </div>
                              {day.events &&
                                day.events.slice(0, 2).map((event: Event) => (
                                  <div
                                    key={event.id}
                                    className="text-[12px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded px-1 py-0.5 truncate mb-0.5 font-medium"
                                    title={event.title}
                                  >
                                    {event.title}
                                  </div>
                                ))}
                              {day.events && day.events.length > 2 && (
                                <div className="text-[9px] text-gray-400">
                                  +{day.events.length - 2}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events Sidebar */}
          <div>
            <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e5e7eb] bg-[#f9fafb] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#374151]" />
                <h2 className="text-sm font-bold text-black">
                  Upcoming Events
                </h2>
                <span className="ml-auto text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                  {upcomingEvents.length}
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  No upcoming events.
                </div>
              ) : (
                <div className="divide-y divide-[#e5e7eb] max-h-[600px] overflow-y-auto">
                  {upcomingEvents.map((event) => {
                    const d = new Date(event.date);
                    const isWeekend = d.getDay() === 5 || d.getDay() === 6;
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 px-5 py-4"
                      >
                        <div
                          className={`text-center text-white rounded-xl px-2 py-1.5 min-w-[42px] shrink-0 ${
                            isWeekend
                              ? "bg-gradient-to-br from-red-500 to-red-600"
                              : "bg-black"
                          }`}
                        >
                          <div className="text-[9px] font-bold uppercase">
                            {d.toLocaleDateString(undefined, {
                              month: "short",
                            })}
                          </div>
                          <div className="text-base font-bold leading-none">
                            {d.getDate()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black line-clamp-2">
                            {event.title}
                          </p>
                          <span className="text-xs text-[#6b7280] flex items-center gap-1 mt-0.5">
                            {event.subjects ? (
                              <>
                                <BookOpen className="h-3 w-3 text-gray-500" />
                                {event.subjects.title} ({event.subjects.code})
                              </>
                            ) : (
                              <>
                                <Globe className="h-3 w-3 text-gray-500" />
                                General
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
