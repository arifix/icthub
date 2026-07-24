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
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Manage Calendar
            </h1>
            <p className="text-amber-100">
              Schedule and manage academic events and important dates
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/events/new"
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Link>
            <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Semester Filter */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="h-5 w-5 text-amber-600" />
          </div>
          <label htmlFor="semester" className="font-semibold text-gray-700">
            Filter by Semester:
          </label>
          <div className="relative flex-1 max-w-xs">
            <select
              id="semester"
              value={selectedSemester}
              onChange={(e) =>
                setSelectedSemester(
                  e.target.value ? Number(e.target.value) : "",
                )
              }
              className="px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white appearance-none cursor-pointer"
            >
              <option value="">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-3">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={goToCurrentMonth}
                className="px-3 py-1 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors duration-200 font-medium"
              >
                Today
              </button>
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-7 gap-1">
              {weekdays.map((day) => (
                <div
                  key={day}
                  className="text-center font-medium text-gray-500 p-3 bg-gray-50 rounded-lg"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-24 border rounded-lg overflow-hidden transition-colors duration-200 ${
                    day.day === 0
                      ? "bg-gray-50"
                      : day.date && isToday(day.date)
                        ? "bg-amber-50 border-amber-200"
                        : "bg-white hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  {day.day > 0 && (
                    <>
                      <div className="p-2 text-right">
                        <span
                          className={`inline-block w-6 h-6 text-center rounded-full text-sm ${
                            day.date && isToday(day.date)
                              ? "bg-amber-600 text-white font-bold"
                              : "text-gray-700"
                          }`}
                        >
                          {day.day}
                        </span>
                      </div>
                      <div className="px-2 pb-2">
                        {day.events && day.events.length > 0 ? (
                          <div className="space-y-1">
                            {day.events.map((event) => (
                              <Link
                                key={event.id}
                                to={`/admin/events/${event.id}`}
                                className=" p-1 rounded bg-amber-100 text-amber-800 truncate flex flex-col gap-1 hover:bg-amber-200 transition-colors duration-150"
                                title={event.title}
                              >
                                <span>{event.title}</span>
                                <span className="flex items-center">
                                  {event.subjects ? (
                                    <>
                                      <BookOpen className="h-3 w-3 mr-1" />
                                      {event.subjects.title}
                                    </>
                                  ) : (
                                    <>
                                      <Globe className="h-3 w-3 mr-1" />
                                      General
                                    </>
                                  )}
                                </span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <Link
                            to={`/admin/events/new?date=${day.dateString}`}
                            className=" text-amber-600 hover:text-amber-800 flex items-center justify-center p-1 rounded hover:bg-amber-50"
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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-3">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            Upcoming Events
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600"></div>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CalendarIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Upcoming Events
              </h3>
              <p className="text-gray-600 mb-6">
                No upcoming events scheduled. Add your first event to get
                started.
              </p>
              <Link
                to="/admin/events/new"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Event
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-5 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl hover:border-amber-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start">
                      <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg px-4 py-3 text-center min-w-[120px] mr-4">
                        <div className="text-sm opacity-90">
                          {new Date(event.date).toLocaleDateString(undefined, {
                            weekday: "long",
                          })}
                        </div>
                        <div className="text-2xl font-bold">
                          {new Date(event.date).getDate()}
                        </div>
                        <div className="text-sm opacity-90">
                          {new Date(event.date).toLocaleDateString(undefined, {
                            month: "long",
                          })}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">
                          {event.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          {event.subjects ? (
                            <>
                              <BookOpen className="h-4 w-4 mr-1" />
                              <span>
                                {event.subjects.title} ({event.subjects.code})
                              </span>
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4 mr-1" />
                              <span>General Event</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">Semester:</span>{" "}
                          {event.semesters?.name}
                        </div>
                        <p className="text-gray-700">
                          <span
                            dangerouslySetInnerHTML={{
                              __html: event.description,
                            }}
                          ></span>
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/events/${event.id}`}
                        className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors duration-200"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={isDeleting}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
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
