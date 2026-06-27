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
  teachers?: Array<{ name: string; designation?: string }>;
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
    className="group bg-white border border-gray-200 hover:border-primary-300 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200"
  >
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-primary-700 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary-800 transition-colors">
        <BookOpen className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className=" font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
            {subject.code}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-2 mb-1">
          {subject.title}
        </h3>
        {subject.teachers && subject.teachers.length > 0 && (
          <p className=" text-gray-500 truncate">
            {subject.teachers[0].name}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-700 transition-colors shrink-0 mt-1" />
    </div>
  </Link>
);

const NoteCard: React.FC<{ note: Note }> = ({ note }) => (
  <Link
    to={`/notes/${note.id}`}
    className="group flex items-start gap-4 bg-white border border-gray-200 hover:border-primary-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200"
  >
    <div className="w-9 h-9 bg-gray-100 group-hover:bg-primary-50 rounded-lg flex items-center justify-center shrink-0 transition-colors">
      <FileText className="h-4 w-4 text-gray-500 group-hover:text-primary-700 transition-colors" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        {note.subjects?.code && (
          <span className=" font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded uppercase">
            {note.subjects.code}
          </span>
        )}
        <span className=" text-gray-400 flex items-center gap-0.5 ml-auto">
          <Clock className="h-3 w-3" />
          {new Date(note.created_at).toLocaleDateString()}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-1 mb-1">
        {note.title}
      </h3>
      <p className=" text-gray-500 line-clamp-1">
        <span
          dangerouslySetInnerHTML={{
            __html: stripHtmlAndTruncate(note.content, 80),
          }}
        />
      </p>
    </div>
  </Link>
);

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const date = new Date(event.date);
  return (
    <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="text-center bg-accent-500 text-kuet-dark rounded-lg px-3 py-2 min-w-[52px] shrink-0">
        <div className=" font-bold uppercase">
          {date.toLocaleDateString(undefined, { month: "short" })}
        </div>
        <div className="text-xl font-bold leading-none">{date.getDate()}</div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">
          {event.title}
        </h3>
        {event.subjects ? (
          <span className=" text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
            {event.subjects.code}
          </span>
        ) : (
          <span className=" text-gray-500 flex items-center gap-1">
            <Globe className="h-3 w-3" />
            General
          </span>
        )}
        <p
          className=" text-gray-500 mt-1 line-clamp-1"
          dangerouslySetInnerHTML={{ __html: event.description }}
        />
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const [recentSubjects, setRecentSubjects] = useState<Subject[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: allSubjects, error: subjectsError } = await supabase
          .from("subjects")
          .select(
            `*, semester:semesters(id, name, is_current), subject_teachers(teachers:teacher_id(name, designation))`,
          )
          .eq("is_active", true)
          .order("title", { ascending: true });

        if (subjectsError) throw subjectsError;

        const subjectsWithTeachers =
          allSubjects
            ?.filter((subject: any) => subject.semester?.is_current === true)
            .map((subject: any) => ({
              ...subject,
              teachers:
                subject.subject_teachers
                  ?.map(
                    (st: {
                      teachers: { name: string; designation?: string };
                    }) => st.teachers,
                  )
                  .filter(Boolean) || [],
            })) || [];
        setRecentSubjects(subjectsWithTeachers);

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
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    document.title = "ICTHub — M.Sc. ICT @ IICT, KUET";
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-primary-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-accent-500 text-kuet-dark text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              M.Sc. Eng. in ICT Programme
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Welcome to ICTHub
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-2xl">
              Your academic resource portal for the Institute of Information and
              Communication Technology (IICT), Khulna University of Engineering
              &amp; Technology.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/subjects"
                className="btn-accent inline-flex items-center gap-2 rounded"
              >
                <BookOpen className="h-4 w-4" />
                Browse Subjects
              </Link>
              <Link
                to="/notes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-white/15 text-white border border-white/30 hover:bg-white/25 transition-colors text-sm font-semibold"
              >
                <FileText className="h-4 w-4" />
                Study Notes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-kuet-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {[
              {
                icon: BookOpen,
                value: recentSubjects.length,
                label: "Current Subjects",
                color: "text-accent-500",
              },
              {
                icon: FileText,
                value: recentNotes.length + "+",
                label: "Study Notes",
                color: "text-accent-500",
              },
              {
                icon: Calendar,
                value: upcomingEvents.length,
                label: "Upcoming Events",
                color: "text-accent-500",
              },
              {
                icon: File,
                value: "IICT",
                label: "KUET",
                color: "text-accent-500",
              },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="flex items-center gap-3 px-6 py-4">
                <Icon className={`h-5 w-5 ${color} shrink-0`} />
                <div>
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className=" text-gray-400">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Quick Access */}
        <div>
          <h2 className="section-heading">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                to: "/subjects",
                label: "Subjects",
                desc: "Courses & materials",
                icon: BookOpen,
                color: "bg-primary-700",
              },
              {
                to: "/notes",
                label: "Notes",
                desc: "Study materials",
                icon: FileText,
                color: "bg-kuet-dark",
              },
              {
                to: "/calendar",
                label: "Calendar",
                desc: "Events & schedule",
                icon: Calendar,
                color: "bg-amber-600",
              },
              {
                to: "/files",
                label: "Files",
                desc: "Resources & docs",
                icon: File,
                color: "bg-teal-700",
              },
            ].map(({ to, label, desc, icon: Icon, color }) => (
              <Link
                key={to}
                to={to}
                className="group bg-white border border-gray-200 hover:border-primary-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-4"
              >
                <div
                  className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center shrink-0`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm group-hover:text-primary-700 transition-colors">
                    {label}
                  </div>
                  <div className=" text-gray-500 mt-0.5">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Current Subjects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-kuet-dark">
              Current Semester Subjects
            </h2>
            <Link
              to="/subjects"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="h-0.5 w-12 bg-accent-500 mb-6" />

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-700 border-t-transparent" />
            </div>
          ) : recentSubjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSubjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
              <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No subjects available for the current semester
              </p>
            </div>
          )}
        </div>

        {/* Notes & Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Recent Notes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-kuet-dark">Recent Notes</h2>
              <Link
                to="/notes"
                className="text-sm font-medium text-primary-700 hover:text-primary-800 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="h-0.5 w-10 bg-accent-500 mb-5" />

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-700 border-t-transparent" />
              </div>
            ) : recentNotes.length > 0 ? (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No notes available yet</p>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-kuet-dark">
                Upcoming Events
              </h2>
              <Link
                to="/calendar"
                className="text-sm font-medium text-primary-700 hover:text-primary-800 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="h-0.5 w-10 bg-accent-500 mb-5" />

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-700 border-t-transparent" />
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
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
