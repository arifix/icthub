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
  User,
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
      <div className="min-h-screen bg-[#f9fafb] flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center px-4">
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
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Page header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
            <Link to="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/subjects" className="hover:text-black transition-colors">
              Subjects
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#6b7280] truncate">{subject.title}</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="inline-block text-xs font-semibold text-[#374151] bg-[#f3f4f6] px-2.5 py-1 rounded-full mb-2 font-mono">
                {subject.code}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
                {subject.title}
              </h1>
              {subject.description && (
                <p className="flex items-center gap-2 mt-4 text-sm text-[#374151] font-semibold max-w-3xl leading-relaxed">
                  <User className="h-3.5 w-3.5" />
                  Teacher: {subject.description}
                </p>
              )}
              {subject.semester && (
                <div className="flex items-center gap-2 mt-2 text-sm text-[#6b7280]">
                  <Calendar className="h-3.5 w-3.5" />
                  Semester: {subject.semester.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Notes */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#f3f4f6] rounded-xl flex items-center justify-center">
                <FileText className="h-4 w-4 text-teal-600" />
              </div>
              <h2 className="text-sm font-bold text-black">Notes</h2>
              <span className="text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                {notes.length}
              </span>
            </div>
            <Link
              to="/notes"
              className="text-sm text-[#6b7280] hover:text-black font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[#e5e7eb]">
            {notes.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No notes for this subject yet.
              </div>
            ) : (
              notes.map((note) => (
                <Link
                  key={note.id}
                  to={`/notes/${note.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9fafb] transition-colors group"
                >
                  <div className="w-8 h-8 bg-[#f3f4f6] group-hover:bg-[#e5e7eb] rounded-xl flex items-center justify-center shrink-0 transition-colors">
                    <FileText className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black group-hover:text-[#374151] transition-colors truncate">
                      {note.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(note.created_at)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-[#6b7280] shrink-0 transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Events */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#f3f4f6] rounded-xl flex items-center justify-center">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              <h2 className="text-sm font-bold text-black">
                Events &amp; Schedule
              </h2>
              <span className="text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                {events.length}
              </span>
            </div>
            <Link
              to="/calendar"
              className="text-sm text-[#6b7280] hover:text-black font-medium transition-colors"
            >
              View calendar →
            </Link>
          </div>
          <div className="divide-y divide-[#e5e7eb]">
            {events.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
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
                    <div className="text-center bg-black text-white rounded-xl px-3 py-2 min-w-[48px] shrink-0">
                      <div className="text-[9px] font-bold uppercase opacity-70">
                        {d.toLocaleDateString(undefined, { month: "short" })}
                      </div>
                      <div className="text-lg font-bold leading-none">
                        {d.getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-black">
                        {event.title}
                      </p>
                      <div
                        className="text-sm text-gray-500 mt-1"
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
        <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#f3f4f6] rounded-xl flex items-center justify-center">
                <File className="h-4 w-4 text-[#374151]" />
              </div>
              <h2 className="text-sm font-bold text-black">
                Files &amp; Resources
              </h2>
              <span className="text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                {files.length}
              </span>
            </div>
            <Link
              to="/files"
              className="text-sm text-[#6b7280] hover:text-black font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          {files.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
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
                  className="group flex items-center gap-3 p-4 border border-[#e5e7eb] hover:border-[#d1d5db] rounded-xl hover:shadow-sm transition-all bg-white hover:bg-[#f9fafb]"
                >
                  <div className="w-9 h-9 bg-[#f3f4f6] group-hover:bg-[#e5e7eb] rounded-xl flex items-center justify-center shrink-0 transition-colors">
                    <File className="h-4 w-4 text-[#374151]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black truncate group-hover:text-[#374151] transition-colors">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="uppercase font-semibold">
                        {file.file_type}
                      </span>{" "}
                      &middot; {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-gray-500 group-hover:text-[#6b7280] shrink-0 transition-colors" />
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
