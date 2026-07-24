import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  FileText,
  File,
  ArrowLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";

type Subject = Database["public"]["Tables"]["subjects"]["Row"] & {
  semester?: { name: string } | null;
};
type Note = Database["public"]["Tables"]["notes"]["Row"];
type Event = Database["public"]["Tables"]["events"]["Row"];
type FileData = Database["public"]["Tables"]["files"]["Row"];

const SubjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjectData = async () => {
      try {
        setLoading(true);
        if (!id) return;

        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .select(`*, semester:semesters(id, name, is_current)`)
          .eq("id", id)
          .eq("is_active", true)
          .single();

        if (subjectError) {
          const { data: basicSubject, error: basicError } = await supabase
            .from("subjects")
            .select("*")
            .eq("id", id)
            .eq("is_active", true)
            .single();
          if (basicError || !basicSubject) {
            setSubject(null);
            return;
          }
          setSubject(basicSubject as Subject);
          document.title = (basicSubject as any)?.title || "Subject";
          return;
        }

        if (!subjectData) {
          setSubject(null);
          return;
        }

        setSubject(subjectData as Subject);
        document.title = `${(subjectData as any)?.title} — ICTHub`;

        const [notesRes, eventsRes, filesRes] = await Promise.all([
          supabase
            .from("notes")
            .select("*")
            .eq("subject_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("events")
            .select("*")
            .eq("subject_id", id)
            .order("date", { ascending: true }),
          supabase
            .from("files")
            .select("*")
            .eq("subject_id", id)
            .order("created_at", { ascending: false }),
        ]);
        setNotes(notesRes.data || []);
        setEvents(eventsRes.data || []);
        setFiles(filesRes.data || []);
      } catch (error) {
        console.error("Error fetching subject data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjectData();
  }, [id]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-700 mb-2">
          Subject Not Found
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          This subject does not exist or has been removed.
        </p>
        <Link
          to="/subjects"
          className="btn-primary inline-flex items-center gap-2 rounded"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Page header */}
      <div className="border-b border-gray-200/80 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              to="/subjects"
              className="hover:text-blue-600 transition-colors"
            >
              Subjects
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-600 truncate">{subject.title}</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full mb-2 font-mono">
                {subject.code}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {subject.title}
              </h1>
              {subject.semester && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {subject.semester.name}
                </div>
              )}
            </div>
          </div>

          {subject.description && (
            <p className="mt-4 text-sm text-gray-600 max-w-3xl leading-relaxed border-t border-gray-100 pt-4">
              {subject.description}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Notes</h2>
              <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                {notes.length}
              </span>
            </div>
            <Link
              to="/notes"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {notes.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No notes for this subject yet.
              </div>
            ) : (
              notes.map((note) => (
                <Link
                  key={note.id}
                  to={`/notes/${note.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-8 h-8 bg-teal-50 group-hover:bg-teal-100 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                    <FileText className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {note.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(note.created_at)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 shrink-0 transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Events */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Events &amp; Schedule
              </h2>
              <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                {events.length}
              </span>
            </div>
            <Link
              to="/calendar"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View calendar →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {events.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No events for this subject yet.
              </div>
            ) : (
              events.map((event) => {
                const d = new Date(event.date);
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 px-6 py-4"
                  >
                    <div className="text-center bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl px-3 py-2 min-w-[48px] shrink-0 shadow-sm">
                      <div className="text-[9px] font-bold uppercase">
                        {d.toLocaleDateString(undefined, { month: "short" })}
                      </div>
                      <div className="text-lg font-bold leading-none">
                        {d.getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {event.title}
                      </p>
                      <div
                        className="text-xs text-gray-400 mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: event.description }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Files */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                <File className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Files &amp; Resources
              </h2>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                {files.length}
              </span>
            </div>
            <Link
              to="/files"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          {files.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No files for this subject yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={file.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-4 border border-gray-100 hover:border-blue-200 rounded-xl hover:shadow-md transition-all bg-gray-50 hover:bg-blue-50"
                >
                  <div className="w-9 h-9 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                    <File className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      <span className="uppercase font-semibold">
                        {file.file_type}
                      </span>{" "}
                      &middot; {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-gray-300 group-hover:text-blue-600 shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectDetailPage;
