import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Trash,
  ChevronDown,
  Globe,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";

type Event = Database["public"]["Tables"]["events"]["Row"] & {
  subjects?: { title: string; code: string } | null;
  semesters: { name: string };
};

type Semester = Database["public"]["Tables"]["semesters"]["Row"];

const AdminCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    document.title = "Calendar — ICTHub Admin";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        { data: eventsData, error: eventsError },
        { data: semestersData, error: semestersError },
      ] = await Promise.all([
        supabase
          .from("events")
          .select(
            `
            *,
            subjects:subject_id (title, code),
            semesters:semester_id (name)
          `,
          )
          .order("date", { ascending: true }),
        supabase
          .from("semesters")
          .select("*")
          .order("name", { ascending: true }),
      ]);

      if (eventsError) throw eventsError;
      if (semestersError) throw semestersError;

      setEvents(eventsData || []);
      setSemesters(semestersData || []);

      // Set current semester as default
      const currentSemester = semestersData?.find((s) => s.is_current);
      if (currentSemester) {
        setSelectedSemester(currentSemester.id);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        setIsDeleting(true);
        const { error } = await supabase.from("events").delete().eq("id", id);

        if (error) throw error;

        setEvents(events.filter((event) => event.id !== id));
        toast.success("Event deleted successfully");
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysCount = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, date: null });
    }

    // Add cells for all days in the month
    for (let i = 1; i <= daysCount; i++) {
      const date = new Date(year, month, i);

      const gmtOffset = 6 * 60 * 60 * 1000; // GMT+6 in milliseconds
      const localDate = new Date(date.getTime() + gmtOffset);
      const dateString = localDate.toISOString().split("T")[0];

      const dayEvents = filteredEvents.filter(
        (event) => event.date === dateString,
      );

      days.push({
        day: i,
        date,
        dateString,
        events: dayEvents,
      });
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const filteredEvents = events.filter(
    (event) =>
      selectedSemester === "" || event.semester_id === selectedSemester,
  );

  const calendarDays = generateCalendarDays();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const upcomingEvents = filteredEvents
    .filter((event) => {
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              Calendar
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Schedule and manage academic events
            </p>
          </div>
          <Link
            to="/admin/events/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-[#374151] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Event
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Semester Filter */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-[#f3f4f6] p-1.5 rounded-lg">
              <CalendarIcon className="h-4 w-4 text-[#374151]" />
            </div>
            <label
              htmlFor="semester"
              className="text-sm font-semibold text-[#374151]"
            >
              Filter by semester:
            </label>
            <div className="relative">
              <select
                id="semester"
                value={selectedSemester}
                onChange={(e) =>
                  setSelectedSemester(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="pl-3 pr-8 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white appearance-none cursor-pointer text-[#374151]"
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl border border-[#e5e7eb]">
          <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-[#374151]" />
            <span className="text-sm font-bold text-black">
              {currentMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={goToCurrentMonth}
                className="px-3 py-1 text-xs font-semibold text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f3f4f6] transition-colors"
              >
                Today
              </button>
              <button
                onClick={goToPreviousMonth}
                className="p-1.5 text-[#374151] hover:text-black hover:bg-[#f3f4f6] rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1.5 text-[#374151] hover:text-black hover:bg-[#f3f4f6] rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-1">
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
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-20 border rounded-lg overflow-hidden ${
                      day.day === 0
                        ? "border-transparent"
                        : day.date && isToday(day.date)
                          ? "border-black bg-white"
                          : "border-[#f3f4f6] bg-white hover:border-[#e5e7eb]"
                    }`}
                  >
                    {day.day > 0 && (
                      <>
                        <div className="p-1.5 flex justify-end">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                              day.date && isToday(day.date)
                                ? "bg-black text-white"
                                : day.date.getDay() === 5 ||
                                    day.date.getDay() === 6
                                  ? "text-red-500"
                                  : "text-[#374151]"
                            }`}
                          >
                            {day.day}
                          </span>
                        </div>
                        <div className="px-1.5 pb-1.5 space-y-0.5">
                          {day.events && day.events.length > 0 ? (
                            day.events.map((event) => (
                              <Link
                                key={event.id}
                                to={`/admin/events/${event.id}`}
                                className="block text-xs bg-[#f3f4f6] text-[#374151] px-1.5 py-0.5 rounded truncate hover:bg-[#e5e7eb] transition-colors"
                                title={event.title}
                              >
                                {event.title}
                              </Link>
                            ))
                          ) : (
                            <Link
                              to={`/admin/events/new?date=${day.dateString}`}
                              className="flex items-center justify-center p-1 text-gray-500 hover:text-gray-500 rounded"
                            >
                              <Plus className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-[#e5e7eb]">
          <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-[#374151]" />
            <span className="text-sm font-bold text-black">
              Upcoming Events
            </span>
            <span className="ml-auto text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
              {upcomingEvents.length}
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-[#f3f4f6] p-3 rounded-xl w-fit mx-auto mb-4">
                <CalendarIcon className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-sm font-semibold text-[#374151]">
                No upcoming events
              </p>
              <Link
                to="/admin/events/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Event
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e7eb]">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9fafb]"
                >
                  <div className="bg-black text-white rounded-lg px-3 py-2 text-center min-w-[56px] shrink-0">
                    <div className="text-xs font-medium opacity-70">
                      {new Date(event.date).toLocaleDateString(undefined, {
                        month: "short",
                      })}
                    </div>
                    <div className="text-lg font-bold leading-none">
                      {new Date(event.date).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#374151] truncate">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      {event.subjects ? (
                        <>
                          <BookOpen className="h-3 w-3 shrink-0" />
                          <span>
                            {event.subjects.title} ({event.subjects.code})
                          </span>
                        </>
                      ) : (
                        <>
                          <Globe className="h-3 w-3 shrink-0" />
                          <span>General</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      to={`/admin/events/${event.id}`}
                      className="p-1.5 text-[#374151] hover:text-black hover:bg-[#f3f4f6] rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={isDeleting}
                      className="p-1.5 text-[#6b7280] hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;
