import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  FileText,
  File,
  ArrowRight,
  Clock,
  Globe,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import { stripHtmlAndTruncate } from "../utils/helper";

type Subject = Database["public"]["Tables"]["subjects"]["Row"] & {
  semester?: { name: string } | null;
};
type Note = Database["public"]["Tables"]["notes"]["Row"] & {
  subjects?: { title: string; code: string } | null;
};
type Event = Database["public"]["Tables"]["events"]["Row"] & {
  subjects?: { title: string; code: string } | null;
};

const SubjectCard: React.FC<{ subject: Subject }> = ({ subject }) => (
  <Link
    to={`/subjects/${subject.id}`}
    className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
  >
    <div className="p-7">
      <div className="flex items-center justify-between mb-5">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-md group-hover:scale-110 transition-transform duration-300">
          <BookOpen className="h-7 w-7 text-white" />
        </div>
        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full font-mono">
          {subject.code}
        </span>
      </div>
      <h2 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
        {subject.title}
      </h2>
      {subject.semester && (
        <div className="flex items-center text-sm text-gray-500 mb-5">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
          <span>{subject.semester.name}</span>
        </div>
      )}
      <div className="flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform duration-200">
        View Details <ArrowRight className="ml-2 h-4 w-4" />
      </div>
    </div>
  </Link>
);

const NoteCard: React.FC<{ note: Note }> = ({ note }) => (
  <Link
    to={`/notes/${note.id}`}
    className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-teal-200"
  >
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="inline-flex items-center justify-center w-9 h-9 bg-teal-100 rounded-lg">
            <FileText className="h-4 w-4 text-teal-600" />
          </div>
          {note.subjects?.code && (
            <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full font-mono">
              {note.subjects.code}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {new Date(note.created_at).toLocaleDateString()}
        </span>
      </div>
      <h3 className="text-sm font-bold mb-2 text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2">
        {note.title}
      </h3>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
        <span
          dangerouslySetInnerHTML={{
            __html: stripHtmlAndTruncate(note.content, 80),
          }}
        />
      </p>
      <div className="flex items-center text-teal-600 font-medium text-sm group-hover:translate-x-1 transition-transform duration-200">
        Read More <ArrowRight className="ml-2 h-4 w-4" />
      </div>
    </div>
  </Link>
);

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const date = new Date(event.date);
  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-amber-200">
      <div className="p-5">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-3 text-center min-w-[60px] shadow-md">
              <div className="text-xs font-medium opacity-90">
                {date.toLocaleDateString(undefined, { month: "short" })}
              </div>
              <div className="text-2xl font-bold leading-tight">
                {date.getDate()}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2 mb-2">
              {event.title}
            </h3>
            {event.subjects ? (
              <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
                <BookOpen className="h-3 w-3 mr-1.5" />
                <span className="font-medium">{event.subjects.code}</span>
              </div>
            ) : (
              <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full w-fit">
                <Globe className="h-3 w-3 mr-1.5" />
                <span>General</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const [recentSubjects, setRecentSubjects] = useState<Subject[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [filesCount, setFilesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: allSubjects, error: subjectsError } = await supabase
          .from("subjects")
          .select(`*, semester:semesters(id, name, is_current)`)
          .eq("is_active", true)
          .order("title", { ascending: true });

        if (subjectsError) throw subjectsError;

        const currentSubjects =
          allSubjects?.filter(
            (subject: any) => subject.semester?.is_current === true,
          ) || [];
        setRecentSubjects(currentSubjects);

        const { data: allNotes, error: notesError } = await supabase
          .from("notes")
          .select(
            `*, subjects:subject_id (title, code, is_active, semester:semesters(id, name, is_current))`,
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (notesError) throw notesError;

        const currentNotes =
          allNotes
            ?.filter(
              (note: any) => note.subjects?.semester?.is_current === true,
            )
            .slice(0, 4) || [];
        setRecentNotes(currentNotes);

        const today = new Date().toISOString().split("T")[0];
        const { data: allEvents, error: eventsError } = await supabase
          .from("events")
          .select(
            `*, subjects:subject_id (title, code, semester:semesters(id, name, is_current))`,
          )
          .eq("is_active", true)
          .gte("date", today)
          .order("date", { ascending: true });

        if (eventsError) throw eventsError;

        const currentEvents =
          allEvents
            ?.filter(
              (event: any) =>
                !event.subjects ||
                event.subjects?.semester?.is_current === true,
            )
            .slice(0, 4) || [];
        setUpcomingEvents(currentEvents);

        const { data: allFiles, error: filesError } = await supabase
          .from("files")
          .select(`*, semester:semesters(id, is_current)`)
          .eq("is_active", true);
        if (filesError) throw filesError;
        setFilesCount(
          allFiles?.filter((f: any) => f.semester?.is_current === true)
            .length ?? 0,
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    document.title = "ICTHub — M.Sc. Eng. in ICT @ IICT, KUET";
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to ICTHub
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Your academic resource portal for the M.Sc. Eng. in ICT programme at
            the Institute of Information and Communication Technology (IICT),
            KUET.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              {
                icon: BookOpen,
                value: recentSubjects.length,
                label: "Subjects",
                color: "text-blue-600",
              },
              {
                icon: FileText,
                value: recentNotes.length,
                label: "Notes",
                color: "text-teal-600",
              },
              {
                icon: Calendar,
                value: upcomingEvents.length,
                label: "Events",
                color: "text-amber-600",
              },
              {
                icon: File,
                value: filesCount,
                label: "Files",
                color: "text-indigo-600",
              },
            ].map(({ icon: Icon, value, label, color }) => (
              <div
                key={label}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-7 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-center mb-2">
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="mt-1 text-sm font-medium text-gray-500">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">
        {/* Quick Access */}
        <div>
          <div className="mb-5">
            <span className="section-label">Navigate</span>
            <h2 className="text-xl font-bold text-gray-900">Quick Access</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <Link
              to="/subjects"
              className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-blue-50 rounded-bl-full transform translate-x-4 -translate-y-4 opacity-60" />
              <div className="relative p-6 sm:p-7">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  Subjects
                </h3>
                <p className="text-sm text-gray-500">Courses & materials</p>
              </div>
            </Link>
            <Link
              to="/notes"
              className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-teal-200"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-teal-50 rounded-bl-full transform translate-x-4 -translate-y-4 opacity-60" />
              <div className="relative p-6 sm:p-7">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">
                  Notes
                </h3>
                <p className="text-sm text-gray-500">Study materials</p>
              </div>
            </Link>
            <Link
              to="/calendar"
              className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-amber-200"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-amber-50 rounded-bl-full transform translate-x-4 -translate-y-4 opacity-60" />
              <div className="relative p-6 sm:p-7">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
                  Calendar
                </h3>
                <p className="text-sm text-gray-500">Events & schedule</p>
              </div>
            </Link>
            <Link
              to="/files"
              className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-50 rounded-bl-full transform translate-x-4 -translate-y-4 opacity-60" />
              <div className="relative p-6 sm:p-7">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <File className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  Files
                </h3>
                <p className="text-sm text-gray-500">Resources & docs</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Current Subjects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="section-label">This Semester</span>
              <h2 className="text-xl font-bold text-gray-900">
                Current Subjects
              </h2>
            </div>
            <Link
              to="/subjects"
              className="flex items-center text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors"
            >
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent" />
            </div>
          ) : recentSubjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSubjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                No subjects available for the current semester
              </p>
            </div>
          )}
        </div>

        {/* Notes & Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Notes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="section-label">Latest</span>
                <h2 className="text-xl font-bold text-gray-900">
                  Recent Notes
                </h2>
              </div>
              <Link
                to="/notes"
                className="flex items-center text-teal-600 font-medium text-sm hover:text-teal-700 transition-colors"
              >
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
              </div>
            ) : recentNotes.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {recentNotes.map((note) => (
                    <Link
                      key={note.id}
                      to={`/notes/${note.id}`}
                      className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal-100 transition-colors">
                        <FileText className="h-4 w-4 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {note.subjects?.code && (
                            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-mono">
                              {note.subjects.code}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                          {note.title}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                          <span
                            dangerouslySetInnerHTML={{
                              __html: stripHtmlAndTruncate(note.content, 80),
                            }}
                          />
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-teal-500 shrink-0 mt-2 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <Link
                    to="/notes"
                    className="text-sm text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1"
                  >
                    Browse all notes <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No notes available yet</p>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="section-label">Upcoming</span>
                <h2 className="text-xl font-bold text-gray-900">Events</h2>
              </div>
              <Link
                to="/calendar"
                className="flex items-center text-amber-600 font-medium text-sm hover:text-amber-700 transition-colors"
              >
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent" />
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {upcomingEvents.map((event) => {
                    const date = new Date(event.date);
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-4"
                      >
                        <div className="flex-shrink-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl px-3 py-2 text-center min-w-[52px] shadow-sm">
                          <div className="text-[10px] font-semibold uppercase opacity-90">
                            {date.toLocaleDateString(undefined, {
                              month: "short",
                            })}
                          </div>
                          <div className="text-lg font-bold leading-tight">
                            {date.getDate()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">
                            {event.title}
                          </p>
                          {event.subjects ? (
                            <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                              <BookOpen className="h-3 w-3 mr-1" />
                              <span className="font-medium">
                                {event.subjects.title} ({event.subjects.code})
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-fit">
                              <Globe className="h-3 w-3 mr-1" />
                              <span>General</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <Link
                    to="/calendar"
                    className="text-sm text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1"
                  >
                    View full calendar <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No upcoming events</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
