import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  File,
  FileText,
  Calendar,
  Plus,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";

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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const statCards = [
    {
      title: "Semesters",
      count: stats.semesters,
      icon: Calendar,
      link: "/admin/semesters",
      addLink: "/admin/semesters/new",
    },
    {
      title: "Subjects",
      count: stats.subjects,
      icon: BookOpen,
      link: "/admin/subjects",
      addLink: "/admin/subjects/new",
    },
    {
      title: "Notes",
      count: stats.notes,
      icon: FileText,
      link: "/admin/notes",
      addLink: "/admin/notes/new",
    },
    {
      title: "Events",
      count: stats.events,
      icon: Calendar,
      link: "/admin/calendar",
      addLink: "/admin/events/new",
    },
    {
      title: "Files",
      count: stats.files,
      icon: File,
      link: "/admin/files",
      addLink: "/admin/files/new",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            ICTHub Admin — IICT, KUET
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a0a0a] border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {statCards.map(({ title, count, icon: Icon, link, addLink }) => (
                <div
                  key={title}
                  className="bg-white rounded-xl border border-[#e5e7eb] p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                      {title}
                    </p>
                    <div className="bg-[#f3f4f6] p-1.5 rounded-lg">
                      <Icon className="h-4 w-4 text-[#374151]" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#0a0a0a]">{count}</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#f3f4f6]">
                    <Link
                      to={addLink}
                      className="text-xs font-semibold text-[#374151] hover:text-[#0a0a0a] flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Link>
                    <span className="text-gray-500">·</span>
                    <Link
                      to={link}
                      className="text-xs font-semibold text-[#374151] hover:text-[#0a0a0a] flex items-center gap-0.5"
                    >
                      View
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Semester Filter */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] px-6 py-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-[#f3f4f6] p-1.5 rounded-lg">
                  <Calendar className="h-4 w-4 text-[#374151]" />
                </div>
                <label
                  htmlFor="semester"
                  className="text-sm font-semibold text-[#374151]"
                >
                  View content for semester:
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
                    className="pl-3 pr-8 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] bg-white appearance-none cursor-pointer text-[#374151]"
                  >
                    <option value="">Select a semester</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-500]" />
                  </div>
                </div>
              </div>
            </div>

            {selectedSemester ? (
              <>
                {/* Recent Subjects + Notes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Subjects */}
                  <div className="bg-white rounded-xl border border-[#e5e7eb]">
                    <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#374151]" />
                      <span className="text-sm font-bold text-[#0a0a0a]">
                        Recent Subjects
                      </span>
                      <Link
                        to="/admin/subjects"
                        className="ml-auto text-xs text-[#6b7280] hover:text-[#0a0a0a] font-medium flex items-center gap-1"
                      >
                        View all <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="divide-y divide-[#e5e7eb]">
                      {recentSubjects.length === 0 ? (
                        <div className="text-center py-10 text-sm text-gray-500]">
                          No subjects in this semester yet.{" "}
                          <Link
                            to="/admin/subjects/new"
                            className="text-[#374151] hover:text-[#0a0a0a] font-medium"
                          >
                            Add one
                          </Link>
                        </div>
                      ) : (
                        recentSubjects.map((subject) => (
                          <Link
                            key={subject.id}
                            to={`/admin/subjects/${subject.id}`}
                            className="flex items-center justify-between px-6 py-3 hover:bg-[#f9fafb]"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#374151] truncate">
                                {subject.title}
                              </p>
                              <p className="text-xs text-gray-500] mt-0.5">
                                {subject.code}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500] ml-4 shrink-0">
                              {formatDate(subject.created_at)}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Notes */}
                  <div className="bg-white rounded-xl border border-[#e5e7eb]">
                    <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#374151]" />
                      <span className="text-sm font-bold text-[#0a0a0a]">
                        Recent Notes
                      </span>
                      <Link
                        to="/admin/notes"
                        className="ml-auto text-xs text-[#6b7280] hover:text-[#0a0a0a] font-medium flex items-center gap-1"
                      >
                        View all <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="divide-y divide-[#e5e7eb]">
                      {recentNotes.length === 0 ? (
                        <div className="text-center py-10 text-sm text-gray-500]">
                          No notes in this semester yet.{" "}
                          <Link
                            to="/admin/notes/new"
                            className="text-[#374151] hover:text-[#0a0a0a] font-medium"
                          >
                            Add one
                          </Link>
                        </div>
                      ) : (
                        recentNotes.map((note) => (
                          <Link
                            key={note.id}
                            to={`/admin/notes/${note.id}`}
                            className="flex items-center justify-between px-6 py-3 hover:bg-[#f9fafb]"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#374151] truncate">
                                {note.title}
                              </p>
                              {note.subjects && (
                                <p className="text-xs text-gray-500] mt-0.5">
                                  {note.subjects.code}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500] ml-4 shrink-0">
                              {formatDate(note.created_at)}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white rounded-xl border border-[#e5e7eb]">
                  <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#374151]" />
                    <span className="text-sm font-bold text-[#0a0a0a]">
                      Upcoming Events
                    </span>
                    <Link
                      to="/admin/calendar"
                      className="ml-auto text-xs text-[#6b7280] hover:text-[#0a0a0a] font-medium flex items-center gap-1"
                    >
                      View calendar <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="divide-y divide-[#e5e7eb]">
                    {upcomingEvents.length === 0 ? (
                      <div className="text-center py-10 text-sm text-gray-500]">
                        No upcoming events.{" "}
                        <Link
                          to="/admin/events/new"
                          className="text-[#374151] hover:text-[#0a0a0a] font-medium"
                        >
                          Schedule one
                        </Link>
                      </div>
                    ) : (
                      upcomingEvents.map((event) => (
                        <Link
                          key={event.id}
                          to={`/admin/events/${event.id}`}
                          className="flex items-center gap-4 px-6 py-3 hover:bg-[#f9fafb]"
                        >
                          <div className="bg-[#0a0a0a] text-white rounded-lg px-3 py-2 text-center min-w-[56px] shrink-0">
                            <div className="text-xs font-medium opacity-70">
                              {new Date(event.date).toLocaleDateString(
                                undefined,
                                { month: "short" },
                              )}
                            </div>
                            <div className="text-lg font-bold leading-none">
                              {new Date(event.date).getDate()}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#374151] truncate">
                              {event.title}
                            </p>
                            {event.subjects && (
                              <p className="text-xs text-gray-500] mt-0.5">
                                {event.subjects.title} ({event.subjects.code})
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500] ml-auto shrink-0">
                            {new Date(event.date).toLocaleDateString(
                              undefined,
                              { weekday: "short" },
                            )}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-12 text-center">
                <div className="bg-[#f3f4f6] p-3 rounded-xl w-fit mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-500]" />
                </div>
                <p className="text-sm font-semibold text-[#374151]">
                  Select a semester
                </p>
                <p className="text-xs text-gray-500] mt-1">
                  Choose a semester above to view recent content and activities.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default AdminDashboard;
