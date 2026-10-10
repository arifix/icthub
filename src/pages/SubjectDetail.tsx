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
  ExternalLink,
  User,
  Info,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import { trackUserActivity } from "../hooks/usePageTracking";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

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
  const { isAdmin } = useAuth();
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(
    null,
  );

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
          document.title = (basicSubject as Subject).title || "Subject";
          return;
        }

        if (!subjectData) {
          setSubject(null);
          return;
        }

        setSubject(subjectData as Subject);
        document.title = `${(subjectData as Subject).title} — ICTHub`;

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
            .order("date", { ascending: false }),
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

  const downloadFile = async (file: FileData) => {
    setDownloadingFileId(file.id);
    try {
      const fileUrl = new URL(file.file_path, window.location.origin);
      const storageMarker = "/object/public/icthub-files/";
      const markerIndex = fileUrl.pathname.indexOf(storageMarker);
      let fileBlob: Blob;

      if (markerIndex >= 0) {
        const storagePath = decodeURIComponent(
          fileUrl.pathname.slice(markerIndex + storageMarker.length),
        );
        const { data, error } = await supabase.storage
          .from("icthub-files")
          .download(storagePath);
        if (error) throw error;
        fileBlob = data;
      } else {
        const response = await fetch(file.file_path);
        if (!response.ok) throw new Error("Unable to download file");
        fileBlob = await response.blob();
      }

      const objectUrl = URL.createObjectURL(fileBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = file.name;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Unable to download this file. Please try again.");
    } finally {
      setDownloadingFileId(null);
    }
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
    <div className="page-subject-detail min-h-screen bg-[#f9fafb]">
      {/* Page header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="inline-block text-sm font-semibold text-[#374151] bg-gray-200 px-2.5 py-1 rounded-full mb-2 font-mono">
                {subject.code}
              </div>
              <h1 className="text-2xl font-bold text-black tracking-tight">
                {subject.title}
              </h1>
              {(subject.description ||
                subject.semester ||
                subject.additional_info) && (
                <div className="mt-5 flex max-w-4xl flex-wrap items-stretch gap-3">
                  {subject.description && (
                    <section className="flex min-w-0 flex-1 basis-full items-start gap-3 rounded-2xl border border-[#d8e5dd] bg-white/75 p-4 shadow-sm sm:basis-[28rem] sm:p-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ee] text-[#176b5b]">
                        <User className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#527267]">
                          Instructor
                        </h2>
                        <p className="mt-1 whitespace-pre-line break-words text-sm font-medium leading-relaxed text-[#263a34] sm:text-base">
                          {subject.description}
                        </p>
                      </div>
                    </section>
                  )}
                  {subject.semester && (
                    <div className="flex min-w-[11rem] items-center gap-3 rounded-2xl border border-[#d8e5dd] bg-white/60 px-4 py-3">
                      <Calendar
                        className="h-4 w-4 shrink-0 text-[#176b5b]"
                        aria-hidden="true"
                      />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#71847c]">
                          Semester
                        </div>
                        <div className="text-sm font-semibold text-[#263a34]">
                          {subject.semester.name}
                        </div>
                      </div>
                    </div>
                  )}
                  {subject.additional_info && (
                    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#d8e5dd] bg-white/60 px-4 py-3 text-[#374d45]">
                      <Info
                        className="h-4 w-4 shrink-0 text-[#176b5b]"
                        aria-hidden="true"
                      />
                      <span className="break-words font-semibold">
                        {subject.additional_info}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 md:space-y-0">
        {/* Notes */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#f3f4f6] rounded-xl flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#0066ff]" />
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
                  onClick={() =>
                    !isAdmin
                      ? void trackUserActivity({
                          eventType: "note_open",
                          page: "/notes",
                          label: note.title,
                          entityType: "note",
                          entityId: note.id,
                          metadata: {
                            subjectId: note.subject_id,
                            subjectCode: note.subjects?.code ?? null,
                          },
                        })
                      : undefined
                  }
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9fafb] transition-colors group"
                >
                  <div className="w-8 h-8 bg-[#f3f4f6] group-hover:bg-[#e5e7eb] rounded-xl flex items-center justify-center shrink-0 transition-colors">
                    <FileText className="h-4 w-4 text-[#0066ff]" />
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
          <div className="divide-y divide-gray-300">
            {events.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No events for this subject yet.
              </div>
            ) : (
              events.map((event) => {
                const d = new Date(event.date);
                const isPast = d < new Date();
                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-4 px-6 py-4 ${isPast ? "opacity-50" : ""}`}
                  >
                    <div className="text-center bg-black text-white rounded-xl px-3 py-2.5 min-w-[54px] shrink-0">
                      <div className="text-[10px] font-bold uppercase opacity-70">
                        {d.toLocaleDateString(undefined, { month: "short" })}
                      </div>
                      <div className="text-xl font-bold leading-none">
                        {d.getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-black">
                        {event.title}
                      </p>
                      <div
                        className="text-sm text-gray-600 mt-1"
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
                <div
                  key={file.id}
                  className="group flex flex-col p-4 border border-[#e5e7eb] hover:border-[#d1d5db] rounded-xl hover:shadow-sm transition-all bg-white hover:bg-[#f9fafb]"
                >
                  <div className="flex items-center gap-3">
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
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">Added on:</span>{" "}
                        {formatDate(file.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={file.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        !isAdmin
                          ? void trackUserActivity({
                              eventType: "file_open",
                              page: `/subjects/${id}`,
                              label: file.name,
                              entityType: "file",
                              entityId: file.id,
                              metadata: {
                                fileType: file.file_type,
                                subjectId: file.subject_id,
                                subjectCode: subject.code,
                              },
                            })
                          : undefined
                      }
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#e5e7eb] px-2 py-1.5 text-xs font-medium text-[#374151] hover:border-[#0066ff] hover:text-[#0066ff] focus:outline-none focus:ring-2 focus:ring-[#0066ff]"
                      aria-label={`Preview ${file.name}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Preview
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAdmin) {
                          void trackUserActivity({
                            eventType: "file_download",
                            page: `/subjects/${id}`,
                            label: file.name,
                            entityType: "file",
                            entityId: file.id,
                            metadata: {
                              fileType: file.file_type,
                              subjectId: file.subject_id,
                              subjectCode: subject.code,
                            },
                          });
                        }
                        void downloadFile(file);
                      }}
                      disabled={downloadingFileId === file.id}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#0066ff] px-2 py-1.5 text-xs font-medium text-white hover:bg-[#0052cc] disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#0066ff]"
                      aria-label={`Download ${file.name}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {downloadingFileId === file.id
                        ? "Downloading..."
                        : "Download"}
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

export default SubjectDetailPage;
