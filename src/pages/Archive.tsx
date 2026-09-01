import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive as ArchiveIcon,
  BookOpen,
  FileText,
  Calendar,
  File,
  ChevronDown,
  Download,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import { useSemesterData } from "../hooks/useSemesterData";
import { stripHtmlAndTruncate } from "../utils/helper.js";
import { trackUserActivity } from "../hooks/usePageTracking";
import { useAuth } from "../context/AuthContext";

type Semester = Database["public"]["Tables"]["semesters"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Note = Database["public"]["Tables"]["notes"]["Row"] & {
  subjects: { title: string; code: string };
};
type Event = Database["public"]["Tables"]["events"]["Row"] & {
  subjects?: { title: string; code: string } | null;
};
type FileData = Database["public"]["Tables"]["files"]["Row"] & {
  subjects: { title: string; code: string };
};

const getSemesterNumber = (name: string) => {
  const match = name.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

const getArchivedSemesters = (semesters: Semester[]): Semester[] => {
  const current = semesters.find((s) => s.is_current);
  if (!current) return [];
  const currentNum = getSemesterNumber(current.name);
  if (!currentNum || currentNum === 1) return [];
  return semesters.filter((s) => {
    const num = getSemesterNumber(s.name);
    return num !== null && num < currentNum;
  });
};

const ArchivePage: React.FC = () => {
  const { allSemesters, loading: semesterLoading } = useSemesterData();
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useAuth();

  const archivedSemesters = getArchivedSemesters(allSemesters)
    .filter((s) => !s.is_current)
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    document.title = "Archive — ICTHub";
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      fetchArchiveData(selectedSemester as number);
    } else {
      setSubjects([]);
      setNotes([]);
      setEvents([]);
      setFiles([]);
    }
  }, [selectedSemester]);

  const fetchArchiveData = async (semesterId: number) => {
    try {
      setLoading(true);
      const [subjectsRes, notesRes, eventsRes, filesRes] = await Promise.all([
        supabase
          .from("subjects")
          .select("*")
          .eq("semester_id", semesterId)
          .eq("is_active", true)
          .order("title", { ascending: true }),
        supabase
          .from("notes")
          .select("*, subjects:subject_id (title, code)")
          .eq("semester_id", semesterId)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("*, subjects:subject_id (title, code)")
          .eq("semester_id", semesterId)
          .eq("is_active", true)
          .order("date", { ascending: true }),
        supabase
          .from("files")
          .select("*, subjects:subject_id (title, code)")
          .eq("semester_id", semesterId)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);
      setSubjects(subjectsRes.data || []);
      setNotes(notesRes.data || []);
      setEvents(eventsRes.data || []);
      setFiles(filesRes.data || []);
    } catch (error) {
      console.error("Error fetching archive data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const stats = [
    {
      icon: BookOpen,
      label: "Subjects",
      count: subjects.length,
    },
    {
      icon: FileText,
      label: "Notes",
      count: notes.length,
    },
    {
      icon: Calendar,
      label: "Events",
      count: events.length,
    },
    {
      icon: File,
      label: "Files",
      count: files.length,
    },
  ];

  if (semesterLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mb-1">
            Semester Archive
          </h1>
          <p className="text-sm text-[#6b7280]">
            Access materials from previous semesters
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <ArchiveIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <select
                value={selectedSemester}
                onChange={(e) =>
                  setSelectedSemester(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="w-full px-5 py-3 pl-11 border border-[#e5e7eb] rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black appearance-none cursor-pointer"
              >
                <option value="">Select an archived semester</option>
                {archivedSemesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
            {!loading && (
              <span className="text-sm text-[#6b7280] whitespace-nowrap sm:self-center">
                {archivedSemesters.length} archived semester
                {archivedSemesters.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {archivedSemesters.length === 0 && (
            <p className="text-sm text-[#6b7280] mt-3">
              No archived semesters available yet.
            </p>
          )}
        </div>

        {!selectedSemester ? (
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-16 text-center">
            <ArchiveIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-base font-semibold text-[#374151] mb-1">
              Select a Semester
            </h2>
            <p className="text-sm text-[#6b7280]">
              Choose an archived semester above to view its materials.
            </p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map(({ icon: Icon, label, count }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl border border-[#e5e7eb] p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-[#f3f4f6] rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-[#374151]" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-black">{count}</div>
                    <div className="text-xs text-[#6b7280]">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {subjects.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <BookOpen className="h-4 w-4 text-[#374151]" />
                  <h2 className="text-sm font-bold text-black">
                    Subjects ({subjects.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
                  {subjects.map((s) => (
                    <Link
                      key={s.id}
                      to={`/subjects/${s.id}`}
                      className="group bg-white rounded-xl border border-[#e5e7eb] hover:border-[#d1d5db] hover:shadow-md transition-all duration-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-xl">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <span className="px-2.5 py-1 bg-[#f3f4f6] text-[#374151] text-xs font-semibold rounded-full font-mono">
                          {s.code}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-black group-hover:text-[#374151] transition-colors line-clamp-2">
                        {s.title}
                      </h3>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {notes.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <FileText className="h-4 w-4 text-[#374151]" />
                  <h2 className="text-sm font-bold text-black">
                    Notes ({notes.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6">
                  {notes.map((note) => (
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
                      className="group bg-white rounded-xl border border-[#e5e7eb] hover:border-[#d1d5db] hover:shadow-md transition-all duration-200 p-4 flex flex-col"
                    >
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="inline-flex items-center justify-center w-9 h-9 bg-[#f3f4f6] rounded-xl">
                          <FileText className="h-4 w-4 text-[#0066ff]" />
                        </div>
                        <span className="text-xs font-semibold text-[#6b7280] bg-[#f3f4f6] px-2.5 py-1 rounded-full font-mono">
                          {note.subjects?.code}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-black group-hover:text-[#374151] transition-colors line-clamp-2 mb-2">
                        {note.title}
                      </h3>
                      <p className="text-sm text-[#6b7280] line-clamp-3 flex-1">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: stripHtmlAndTruncate(note.content, 110),
                          }}
                        />
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {events.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <Calendar className="h-4 w-4 text-[#374151]" />
                  <h2 className="text-sm font-bold text-black">
                    Events ({events.length})
                  </h2>
                </div>
                <div className="divide-y divide-[#e5e7eb]">
                  {events.map((event) => {
                    const d = new Date(event.date);
                    return (
                      <div
                        key={event.id}
                        className="px-6 py-4 flex items-start gap-4"
                      >
                        <div className="text-center bg-black text-white rounded-xl px-3 py-2 min-w-[54px] shrink-0">
                          <div className="text-[10px] font-bold uppercase tracking-wide">
                            {d.toLocaleDateString(undefined, {
                              month: "short",
                            })}
                          </div>
                          <div className="text-base font-bold leading-none mt-0.5">
                            {d.getDate()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black line-clamp-1">
                            {event.title}
                          </p>
                          {event.subjects && (
                            <p className="text-xs text-[#6b7280] mt-1">
                              {event.subjects.title} ({event.subjects.code})
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <File className="h-4 w-4 text-[#374151]" />
                  <h2 className="text-sm font-bold text-black">
                    Files ({files.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
                  {files.map((file) => (
                    <a
                      key={file.id}
                      href={file.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        !isAdmin
                          ? void trackUserActivity({
                              eventType: "file_open",
                              page: "/files",
                              label: file.name,
                              entityType: "file",
                              entityId: file.id,
                              metadata: {
                                fileType: file.file_type,
                                subjectId: file.subject_id,
                                subjectCode: file.subjects?.code ?? null,
                              },
                            })
                          : undefined
                      }
                      className="group bg-white rounded-xl border border-[#e5e7eb] hover:border-[#d1d5db] hover:shadow-md transition-all duration-200 p-4"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#f3f4f6] group-hover:bg-[#e5e7eb] rounded-xl flex items-center justify-center shrink-0 transition-colors">
                          <File className="h-5 w-5 text-[#374151]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black group-hover:text-[#374151] transition-colors line-clamp-2 leading-tight">
                            {file.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded uppercase bg-[#f3f4f6] text-[#374151]">
                            {file.file_type}
                          </span>
                          <span className="text-xs text-[#6b7280]">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                        <Download className="h-4 w-4 text-[#6b7280] group-hover:text-[#374151] transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {subjects.length === 0 &&
              notes.length === 0 &&
              events.length === 0 &&
              files.length === 0 && (
                <div className="bg-white rounded-xl border border-[#e5e7eb] p-12 text-center">
                  <ArchiveIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280]">
                    No archived content found for this semester.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivePage;
