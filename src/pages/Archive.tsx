import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive as ArchiveIcon,
  BookOpen,
  FileText,
  Calendar,
  File,
  ChevronDown,
  ChevronRight,
  Download,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import { useSemesterData } from "../hooks/useSemesterData";
import { stripHtmlAndTruncate } from "../utils/helper.js";

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

  if (semesterLoading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Page header */}
      <div className="border-b border-gray-200/80 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Semester Archive
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Access materials from previous semesters
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Semester selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-5 border border-gray-100 mb-8 flex items-center gap-4">
          <ArchiveIcon className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1 max-w-xs relative">
            <select
              value={selectedSemester}
              onChange={(e) =>
                setSelectedSemester(
                  e.target.value ? Number(e.target.value) : "",
                )
              }
              className="w-full pl-4 pr-8 py-3 border border-gray-200 rounded-xl text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="">Select a semester</option>
              {archivedSemesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {archivedSemesters.length === 0 && (
            <p className="text-sm text-gray-500">
              No archived semesters available yet.
            </p>
          )}
        </div>

        {!selectedSemester ? (
          <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
            <ArchiveIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              Select a Semester
            </h2>
            <p className="text-sm text-gray-500">
              Choose a semester above to view its archived materials.
            </p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a0a0a] border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: BookOpen,
                  label: "Subjects",
                  count: subjects.length,
                  color: "text-[#374151] bg-[#f3f4f6]",
                },
                {
                  icon: FileText,
                  label: "Notes",
                  count: notes.length,
                  color: "text-[#374151] bg-[#f3f4f6]",
                },
                {
                  icon: Calendar,
                  label: "Events",
                  count: events.length,
                  color: "text-[#374151] bg-[#f3f4f6]",
                },
                {
                  icon: File,
                  label: "Files",
                  count: files.length,
                  color: "text-[#374151] bg-[#f3f4f6]",
                },
              ].map(({ icon: Icon, label, count, color }) => (
                <div
                  key={label}
                  className="bg-white border border-[#e5e7eb] rounded-lg p-4 flex items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded flex items-center justify-center ${color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#0a0a0a]">
                      {count}
                    </div>
                    <div className="text-xs text-[#9ca3af]">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subjects */}
            {subjects.length > 0 && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <BookOpen className="h-4 w-4 text-[#6b7280]" />
                  <h2 className="text-sm font-bold text-[#0a0a0a]">
                    Subjects ({subjects.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                  {subjects.map((s) => (
                    <Link
                      key={s.id}
                      to={`/subjects/${s.id}`}
                      className="group border border-[#e5e7eb] hover:border-[#d1d5db] rounded-lg p-4 hover:shadow-sm transition-all"
                    >
                      <span className="text-xs font-semibold text-[#6b7280] bg-[#f3f4f6] px-1.5 py-0.5 rounded mb-2 inline-block font-mono">
                        {s.code}
                      </span>
                      <p className="text-sm font-semibold text-[#0a0a0a]">
                        {s.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {notes.length > 0 && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <FileText className="h-4 w-4 text-[#6b7280]" />
                  <h2 className="text-sm font-bold text-[#0a0a0a]">
                    Notes ({notes.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                  {notes.map((note) => (
                    <Link
                      key={note.id}
                      to={`/notes/${note.id}`}
                      className="group border border-[#e5e7eb] hover:border-[#d1d5db] rounded-lg p-4 hover:shadow-sm transition-all"
                    >
                      <span className="text-xs font-semibold text-[#6b7280] bg-[#f3f4f6] px-1.5 py-0.5 rounded mb-2 inline-block font-mono">
                        {note.subjects?.code}
                      </span>
                      <p className="text-sm font-semibold text-[#0a0a0a] line-clamp-1 mb-1">
                        {note.title}
                      </p>
                      <p className="text-xs text-[#9ca3af] line-clamp-2">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: stripHtmlAndTruncate(note.content, 80),
                          }}
                        />
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {events.length > 0 && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <Calendar className="h-4 w-4 text-[#6b7280]" />
                  <h2 className="text-sm font-bold text-[#0a0a0a]">
                    Events ({events.length})
                  </h2>
                </div>
                <div className="divide-y divide-[#e5e7eb]">
                  {events.map((event) => {
                    const d = new Date(event.date);
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-4 px-5 py-4"
                      >
                        <div className="text-center bg-[#0a0a0a] text-white rounded px-2.5 py-1.5 min-w-[46px] shrink-0">
                          <div className="text-[9px] font-bold uppercase">
                            {d.toLocaleDateString(undefined, {
                              month: "short",
                            })}
                          </div>
                          <div className="text-base font-bold leading-none">
                            {d.getDate()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0a0a0a] line-clamp-1">
                            {event.title}
                          </p>
                          {event.subjects && (
                            <p className="text-xs text-[#9ca3af]">
                              {event.subjects.code}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <File className="h-4 w-4 text-[#6b7280]" />
                  <h2 className="text-sm font-bold text-[#0a0a0a]">
                    Files ({files.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                  {files.map((file) => (
                    <a
                      key={file.id}
                      href={file.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group border border-[#e5e7eb] hover:border-[#d1d5db] rounded-lg p-4 hover:shadow-sm transition-all flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-[#f3f4f6] group-hover:bg-[#e5e7eb] rounded flex items-center justify-center shrink-0 transition-colors">
                        <File className="h-4 w-4 text-[#9ca3af]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0a0a0a] truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-[#9ca3af] uppercase">
                          {file.file_type} &middot; {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Download className="h-4 w-4 text-[#d1d5db] group-hover:text-[#374151] shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {subjects.length === 0 &&
              notes.length === 0 &&
              events.length === 0 &&
              files.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                  <ArchiveIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
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
