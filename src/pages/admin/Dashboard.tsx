import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  File,
  FileText,
  Calendar,
  Plus,
  ArrowRight,
  Users,
  GraduationCap,
  TrendingUp,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { stripHtmlAndTruncate } from "../../utils/helper.js";

type Subject = Database["public"]["Tables"]["subjects"]["Row"] & {
  semesters?: { name: string } | null;
};
type Note = Database["public"]["Tables"]["notes"]["Row"] & {
  subjects: { title: string; code: string };
  semesters?: { name: string } | null;
};
type Event = Database["public"]["Tables"]["events"]["Row"] & {
  subjects?: { title: string; code: string } | null;
  semesters?: { name: string } | null;
};
type Semester = Database["public"]["Tables"]["semesters"]["Row"];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    subjects: 0,
    notes: 0,
    events: 0,
    files: 0,
    semesters: 0,
  });
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [recentSubjects, setRecentSubjects] = useState<Subject[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      fetchSemesterData();
    }
  }, [selectedSemester]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Fetch counts and semesters
      const [
        { count: subjectsCount },
        { count: notesCount },
        { count: eventsCount },
        { count: filesCount },
        { count: semestersCount },
        { data: semestersData, error: semestersError },
      ] = await Promise.all([
        supabase.from("subjects").select("*", { count: "exact", head: true }),
        supabase.from("notes").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("files").select("*", { count: "exact", head: true }),
        supabase.from("semesters").select("*", { count: "exact", head: true }),
        supabase
          .from("semesters")
          .select("*")
          .order("name", { ascending: true }),
      ]);

      if (semestersError) throw semestersError;

      setStats({
        subjects: subjectsCount || 0,
        notes: notesCount || 0,
        events: eventsCount || 0,
        files: filesCount || 0,
        semesters: semestersCount || 0,
      });

      setSemesters(semestersData || []);

      // Set current semester as default
      const currentSemester = semestersData?.find((s) => s.is_current);
      if (currentSemester) {
        setSelectedSemester(currentSemester.id);
      }

      document.title = "ICTHub Admin";
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSemesterData = async () => {
    try {
      // Fetch recent subjects for selected semester
      const { data: subjects } = await supabase
        .from("subjects")
        .select(
          `
          *,
          semesters:semester_id (name)
        `,
        )
        .eq("semester_id", selectedSemester)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentSubjects(subjects || []);

      // Fetch recent notes for selected semester
      const { data: notes } = await supabase
        .from("notes")
        .select(
          `
          *,
          subjects:subject_id (title, code),
          semesters:semester_id (name)
        `,
        )
        .eq("semester_id", selectedSemester)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentNotes(notes || []);

      // Fetch upcoming events for selected semester
      const today = new Date().toISOString().split("T")[0];
      const { data: events } = await supabase
        .from("events")
        .select(
          `
          *,
          subjects:subject_id (title, code),
          semesters:semester_id (name)
        `,
        )
        .eq("semester_id", selectedSemester)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(5);

      setUpcomingEvents(events || []);
    } catch (error) {
      console.error("Error fetching semester data:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Semesters",
      count: stats.semesters,
      icon: Calendar,
      color: "indigo",
      link: "/admin/semesters",
      addLink: "/admin/semesters/new",
    },
    {
      title: "Subjects",
      count: stats.subjects,
      icon: BookOpen,
      color: "blue",
      link: "/admin/subjects",
      addLink: "/admin/subjects/new",
    },
    {
      title: "Notes",
      count: stats.notes,
      icon: FileText,
      color: "emerald",
      link: "/admin/notes",
      addLink: "/admin/notes/new",
    },
    {
      title: "Events",
      count: stats.events,
      icon: Calendar,
      color: "amber",
      link: "/admin/calendar",
      addLink: "/admin/events/new",
    },
    {
      title: "Files",
      count: stats.files,
      icon: File,
      color: "purple",
      link: "/admin/files",
      addLink: "/admin/files/new",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-green-600 to-green-700 bg-green-100 text-green-700",
      emerald:
        "from-emerald-500 to-emerald-600 bg-emerald-100 text-emerald-600",
      amber: "from-amber-500 to-amber-600 bg-amber-100 text-amber-600",
      purple: "from-violet-500 to-violet-600 bg-violet-100 text-violet-600",
      indigo: "from-green-700 to-green-800 bg-green-100 text-green-800",
      rose: "from-rose-500 to-rose-600 bg-rose-100 text-rose-600",
      green: "from-green-500 to-green-600 bg-green-100 text-green-600",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-green-700 rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              ICTHub Admin Dashboard — IICT, KUET
            </h1>
            <p className="text-green-100">
              Welcome to your study portal admin dashboard. Manage all aspects
              of your educational platform from here.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <TrendingUp className="h-6 w-6 text-white mr-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {statCards.map((card) => {
          const colorClasses = getColorClasses(card.color);
          const [gradientClasses, iconBgClasses] = colorClasses.split(" bg-");

          return (
            <Link
              key={card.title}
              to={card.link}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradientClasses}`}
                  >
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {card.count}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {card.title}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
                  <Link
                    to={card.addLink}
                    className={`inline-flex items-center  font-semibold hover:underline ${
                      iconBgClasses.split(" ")[1]
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add New
                  </Link>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center text-gray-500 group-hover:text-gray-700  font-medium">
                    <span>View All</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Semester Filter */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-green-700" />
          </div>
          <label htmlFor="semester" className="font-semibold text-gray-700">
            View content for semester:
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
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 bg-white appearance-none cursor-pointer font-medium text-gray-700"
            >
              <option value="">Select a semester</option>
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

      {selectedSemester ? (
        <>
          {/* Recent Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Subjects */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-700 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 ml-3">
                      Recent Subjects
                    </h2>
                  </div>
                  <Link
                    to="/admin/subjects"
                    className="text-sm text-green-700 hover:text-green-900 flex items-center font-semibold"
                  >
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {recentSubjects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-3 font-medium">
                      No subjects in this semester yet.
                    </p>
                    <Link
                      to="/admin/subjects/new"
                      className="inline-flex items-center text-green-700 hover:text-green-900 font-semibold"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add your first subject
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSubjects.map((subject) => (
                      <Link
                        key={subject.id}
                        to={`/admin/subjects/${subject.id}`}
                        className="block p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1 truncate">
                              {subject.title}
                            </h3>
                            <p className="text-sm text-green-700 font-semibold mb-2">
                              {subject.code}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {subject.description}
                            </p>
                          </div>
                          <div className=" text-gray-500 whitespace-nowrap">
                            {formatDate(subject.created_at)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Notes */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 ml-3">
                      Recent Notes
                    </h2>
                  </div>
                  <Link
                    to="/admin/notes"
                    className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center font-semibold"
                  >
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {recentNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-3 font-medium">
                      No notes in this semester yet.
                    </p>
                    <Link
                      to="/admin/notes/new"
                      className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-semibold"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add your first note
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentNotes.map((note) => (
                      <Link
                        key={note.id}
                        to={`/admin/notes/${note.id}`}
                        className="block p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-2 truncate">
                              {note.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: stripHtmlAndTruncate(
                                    note.content,
                                    100,
                                  ),
                                }}
                              ></span>
                            </p>
                          </div>
                          <div className=" text-gray-500 whitespace-nowrap">
                            {formatDate(note.created_at)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 ml-3">
                    Upcoming Events
                  </h2>
                </div>
                <Link
                  to="/admin/calendar"
                  className="text-sm text-amber-600 hover:text-amber-800 flex items-center font-semibold"
                >
                  View Calendar
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="p-6">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-3 font-medium">
                    No upcoming events in this semester.
                  </p>
                  <Link
                    to="/admin/events/new"
                    className="inline-flex items-center text-amber-600 hover:text-amber-800 font-semibold"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Schedule an event
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/admin/events/${event.id}`}
                      className="block p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 bg-white"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl px-4 py-3 text-center min-w-[120px] shadow-sm">
                          <div className=" font-medium opacity-90">
                            {new Date(event.date).toLocaleDateString(
                              undefined,
                              {
                                weekday: "long",
                              },
                            )}
                          </div>
                          <div className="text-2xl font-bold my-1">
                            {new Date(event.date).getDate()}
                          </div>
                          <div className=" font-medium opacity-90">
                            {new Date(event.date).toLocaleDateString(
                              undefined,
                              {
                                month: "long",
                              },
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 truncate">
                            {event.title}
                          </h3>
                          {event.subjects && (
                            <p className="text-sm text-green-700 font-semibold mb-2">
                              {event.subjects.title} ({event.subjects.code})
                            </p>
                          )}
                          <p className="text-sm text-gray-600 line-clamp-2">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: event.description,
                              }}
                            ></span>
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Select a Semester
          </h2>
          <p className="text-gray-600">
            Choose a semester from the dropdown above to view recent content and
            activities.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
