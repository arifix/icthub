import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Archive as ArchiveIcon, BookOpen, FileText, Calendar, File, ChevronDown, ChevronRight, Download } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import { useSemesterData } from "../hooks/useSemesterData";
import { stripHtmlAndTruncate } from "../utils/helper.js";

type Semester = Database["public"]["Tables"]["semesters"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Note = Database["public"]["Tables"]["notes"]["Row"] & { subjects: { title: string; code: string } };
type Event = Database["public"]["Tables"]["events"]["Row"] & { subjects?: { title: string; code: string } | null };
type FileData = Database["public"]["Tables"]["files"]["Row"] & { subjects: { title: string; code: string } };

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

  useEffect(() => { document.title = "Archive — ICTHub"; }, []);

  useEffect(() => {
    if (selectedSemester) {
      fetchArchiveData(selectedSemester as number);
    } else {
      setSubjects([]); setNotes([]); setEvents([]); setFiles([]);
    }
  }, [selectedSemester]);

  const fetchArchiveData = async (semesterId: number) => {
    try {
      setLoading(true);
      const [subjectsRes, notesRes, eventsRes, filesRes] = await Promise.all([
        supabase.from("subjects").select("*").eq("semester_id", semesterId).eq("is_active", true).order("title", { ascending: true }),
        supabase.from("notes").select("*, subjects:subject_id (title, code)").eq("semester_id", semesterId).eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("events").select("*, subjects:subject_id (title, code)").eq("semester_id", semesterId).eq("is_active", true).order("date", { ascending: true }),
        supabase.from("files").select("*, subjects:subject_id (title, code)").eq("semester_id", semesterId).eq("is_active", true).order("created_at", { ascending: false }),
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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Archive</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Semester Archive</h1>
          <p className="text-white/70 mt-1 text-sm">Access materials from previous semesters</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Semester selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-8 flex items-center gap-4">
          <ArchiveIcon className="h-5 w-5 text-primary-700 shrink-0" />
          <div className="flex-1 max-w-xs relative">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value ? Number(e.target.value) : "")}
              className="w-full pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary-700 cursor-pointer font-medium"
            >
              <option value="">Select a semester</option>
              {archivedSemesters.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {archivedSemesters.length === 0 && (
            <p className="text-sm text-gray-500">No archived semesters available yet.</p>
          )}
        </div>

        {!selectedSemester ? (
          <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
            <ArchiveIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">Select a Semester</h2>
            <p className="text-sm text-gray-500">Choose a semester above to view its archived materials.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-700 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: BookOpen, label: "Subjects", count: subjects.length, color: "text-primary-700 bg-primary-50" },
                { icon: FileText, label: "Notes", count: notes.length, color: "text-teal-700 bg-teal-50" },
                { icon: Calendar, label: "Events", count: events.length, color: "text-amber-700 bg-amber-50" },
                { icon: File, label: "Files", count: files.length, color: "text-gray-700 bg-gray-100" },
              ].map(({ icon: Icon, label, count, color }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">{count}</div>
                    <div className=" text-gray-500">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subjects */}
            {subjects.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <BookOpen className="h-4 w-4 text-primary-700" />
                  <h2 className="text-sm font-bold text-gray-900">Subjects ({subjects.length})</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                  {subjects.map((s) => (
                    <Link key={s.id} to={`/subjects/${s.id}`}
                      className="group border border-gray-200 hover:border-primary-300 rounded-lg p-4 hover:shadow-sm transition-all">
                      <span className=" font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded mb-2 inline-block">{s.code}</span>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">{s.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {notes.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <FileText className="h-4 w-4 text-teal-600" />
                  <h2 className="text-sm font-bold text-gray-900">Notes ({notes.length})</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                  {notes.map((note) => (
                    <Link key={note.id} to={`/notes/${note.id}`}
                      className="group border border-gray-200 hover:border-primary-300 rounded-lg p-4 hover:shadow-sm transition-all">
                      <span className=" font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded mb-2 inline-block">{note.subjects?.code}</span>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-1 mb-1">{note.title}</p>
                      <p className=" text-gray-500 line-clamp-2">
                        <span dangerouslySetInnerHTML={{ __html: stripHtmlAndTruncate(note.content, 80) }} />
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {events.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <h2 className="text-sm font-bold text-gray-900">Events ({events.length})</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {events.map((event) => {
                    const d = new Date(event.date);
                    return (
                      <div key={event.id} className="flex items-start gap-4 px-5 py-4">
                        <div className="text-center bg-accent-500 text-kuet-dark rounded px-2.5 py-1.5 min-w-[46px] shrink-0">
                          <div className="text-[9px] font-bold uppercase">{d.toLocaleDateString(undefined, { month: "short" })}</div>
                          <div className="text-base font-bold leading-none">{d.getDate()}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{event.title}</p>
                          {event.subjects && <p className=" text-gray-500">{event.subjects.code}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <File className="h-4 w-4 text-gray-600" />
                  <h2 className="text-sm font-bold text-gray-900">Files ({files.length})</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                  {files.map((file) => (
                    <a key={file.id} href={file.file_path} target="_blank" rel="noopener noreferrer"
                      className="group border border-gray-200 hover:border-primary-300 rounded-lg p-4 hover:shadow-sm transition-all flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 group-hover:bg-primary-50 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                        <File className="h-4 w-4 text-gray-500 group-hover:text-primary-700 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className=" text-gray-400 uppercase">{file.file_type} &middot; {formatFileSize(file.size)}</p>
                      </div>
                      <Download className="h-4 w-4 text-gray-300 group-hover:text-primary-700 shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {subjects.length === 0 && notes.length === 0 && events.length === 0 && files.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <ArchiveIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No archived content found for this semester.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivePage;
