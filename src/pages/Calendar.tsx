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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Academic Calendar
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Events, schedules and important dates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-base font-bold text-gray-900">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-md transition-all"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a0a0a] border-t-transparent" />
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-7 mb-2">
                    {weekdays.map((day, i) => (
                      <div
                        key={day}
                        className={`text-center  font-semibold py-2 ${i >= 5 ? "text-red-500" : "text-gray-500"}`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-16 rounded p-1  ${
                          day.day === 0
                            ? "bg-transparent"
                            : day.date && isToday(day.date)
                              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl"
                              : "bg-white hover:bg-blue-50 border border-gray-100 rounded-lg"
                        }`}
                      >
                        {day.day > 0 && (
                          <>
                            <div
                              className={`text-right mb-1 font-semibold ${day.date && isToday(day.date) ? "text-white" : "text-gray-700"}`}
                            >
                              {day.day}
                            </div>
                            {day.events &&
                              day.events.slice(0, 2).map((event: Event) => (
                                <div
                                  key={event.id}
                                  className="text-[9px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded px-1 py-0.5 truncate mb-0.5 font-medium"
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events Sidebar */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold text-gray-900">
                  Upcoming Events
                </h2>
                <span className="ml-auto text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                  {upcomingEvents.length}
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0a0a0a] border-t-transparent" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  No upcoming events.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {upcomingEvents.map((event) => {
                    const d = new Date(event.date);
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 px-5 py-4"
                      >
                        <div className="text-center bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl px-2 py-1.5 min-w-[42px] shrink-0 shadow-sm">
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
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {event.title}
                          </p>
                          <span className=" text-gray-500 flex items-center gap-1 mt-0.5">
                            {event.subjects ? (
                              <>
                                <BookOpen className="h-3 w-3 text-gray-400" />
                                {event.subjects.code}
                              </>
                            ) : (
                              <>
                                <Globe className="h-3 w-3 text-gray-400" />
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
