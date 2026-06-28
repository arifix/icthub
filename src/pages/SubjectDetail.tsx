import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, Calendar, FileText, File, ArrowLeft, ChevronRight, Download } from "lucide-react";
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
            .from("subjects").select("*").eq("id", id).eq("is_active", true).single();
          if (basicError || !basicSubject) { setSubject(null); return; }
          setSubject(basicSubject as Subject);
          document.title = (basicSubject as any)?.title || "Subject";
          return;
        }

        if (!subjectData) { setSubject(null); return; }

        setSubject(subjectData as Subject);
        document.title = `${(subjectData as any)?.title} — ICTHub`;

        const [notesRes, eventsRes, filesRes] = await Promise.all([
          supabase.from("notes").select("*").eq("subject_id", id).order("created_at", { ascending: false }),
          supabase.from("events").select("*").eq("subject_id", id).order("date", { ascending: true }),
          supabase.from("files").select("*").eq("subject_id", id).order("created_at", { ascending: false }),
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
    new Date(dateString).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-700 border-t-transparent" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-700 mb-2">Subject Not Found</h1>
        <p className="text-gray-500 text-sm mb-6">This subject does not exist or has been removed.</p>
        <Link to="/subjects" className="btn-primary inline-flex items-center gap-2 rounded">
          <ArrowLeft className="h-4 w-4" /> Back to Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/subjects" className="hover:text-white transition-colors">Subjects</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white truncate">{subject.title}</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-lg flex items-center justify-center border border-white/20 shrink-0">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="inline-block bg-accent-500 text-white  font-bold px-2.5 py-1 rounded mb-2">
                {subject.code}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{subject.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-white/80">
                {subject.semester && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-accent-500" />
                    {subject.semester.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {subject.description && (
            <p className="mt-4 text-white/75 text-sm max-w-3xl leading-relaxed border-t border-white/15 pt-4">
              {subject.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary-700" />
              <h2 className="text-base font-bold text-gray-900">Notes</h2>
              <span className=" bg-primary-50 text-primary-700 font-semibold px-2 py-0.5 rounded">{notes.length}</span>
            </div>
            <Link to="/notes" className="text-sm text-primary-700 hover:text-primary-800 font-medium transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {notes.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">No notes for this subject yet.</div>
            ) : (
              notes.map((note) => (
                <Link key={note.id} to={`/notes/${note.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-primary-50 transition-colors group">
                  <div className="w-8 h-8 bg-primary-50 group-hover:bg-primary-100 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                    <FileText className="h-4 w-4 text-primary-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">{note.title}</p>
                    <p className=" text-gray-500">{formatDate(note.created_at)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-700 shrink-0 transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Events */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-bold text-gray-900">Events &amp; Schedule</h2>
              <span className=" bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded">{events.length}</span>
            </div>
            <Link to="/calendar" className="text-sm text-primary-700 hover:text-primary-800 font-medium transition-colors">
              View calendar →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {events.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">No events for this subject yet.</div>
            ) : (
              events.map((event) => {
                const d = new Date(event.date);
                return (
                  <div key={event.id} className="flex items-start gap-4 px-6 py-4">
                    <div className="text-center bg-accent-500 text-white rounded-lg px-3 py-2 min-w-[48px] shrink-0">
                      <div className="text-[9px] font-bold uppercase">{d.toLocaleDateString(undefined, { month: "short" })}</div>
                      <div className="text-lg font-bold leading-none">{d.getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                      <div className=" text-gray-500 mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: event.description }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Files */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <File className="h-5 w-5 text-teal-600" />
              <h2 className="text-base font-bold text-gray-900">Files &amp; Resources</h2>
              <span className=" bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded">{files.length}</span>
            </div>
            <Link to="/files" className="text-sm text-primary-700 hover:text-primary-800 font-medium transition-colors">
              View all →
            </Link>
          </div>
          {files.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">No files for this subject yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {files.map((file) => (
                <a key={file.id} href={file.file_path} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-4 border border-gray-200 hover:border-primary-300 rounded-lg hover:shadow-sm transition-all">
                  <div className="w-9 h-9 bg-gray-100 group-hover:bg-primary-50 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                    <File className="h-4 w-4 text-gray-500 group-hover:text-primary-700 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-700 transition-colors">{file.name}</p>
                    <p className=" text-gray-500">
                      <span className="uppercase font-semibold">{file.file_type}</span> &middot; {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-gray-300 group-hover:text-primary-700 shrink-0 transition-colors" />
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
