import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  ChevronDown,
  Clock,
  BookOpen,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import { stripHtmlAndTruncate } from "../utils/helper.js";

type Note = Database["public"]["Tables"]["notes"]["Row"] & {
  subjects: { title: string; code: string };
  comment_count: number;
};
type Subject = Database["public"]["Tables"]["subjects"]["Row"];

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<number | "">("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: notesData, error: notesError } = await supabase
          .from("notes")
          .select(
            `*, subjects:subject_id (title, code), semester:semesters!inner(id, name, is_current)`,
          )
          .eq("is_active", true)
          .eq("semester.is_current", true)
          .order("created_at", { ascending: false });

        if (notesError) throw notesError;

        let notesWithCommentCount: Note[] = [];
        if (notesData) {
          notesWithCommentCount = await Promise.all(
            notesData.map(async (note) => {
              const { count } = await supabase
                .from("note_comments")
                .select("*", { count: "exact", head: true })
                .eq("note_id", note.id)
                .eq("is_active", true);
              return { ...note, comment_count: count || 0 };
            }),
          );
        }
        setNotes(notesWithCommentCount);

        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("*, semester:semesters!inner(id, name, is_current)")
          .eq("is_active", true)
          .eq("semester.is_current", true)
          .order("title", { ascending: true });
        setSubjects(subjectsData || []);
        document.title = "Notes — ICTHub";
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.subjects?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.subjects?.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject =
      selectedSubject === "" || note.subject_id === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Page header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight mb-1">
            Study Notes
          </h1>
          <p className="text-sm text-[#6b7280]">
            Browse and search through study materials for the current semester
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="max-w-3xl mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500]" />
              <input
                type="text"
                placeholder="Search by title, content or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-3 pl-11 border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] transition-all bg-white text-sm"
              />
            </div>
            <div className="relative w-full sm:w-56">
              <select
                value={selectedSubject}
                onChange={(e) =>
                  setSelectedSubject(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="w-full pl-4 pr-10 py-3 border border-[#e5e7eb] rounded-xl text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] cursor-pointer"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500] pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0a0a0a] border-t-transparent" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-16 text-center">
            <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-base font-semibold text-[#374151] mb-1">
              {notes.length === 0 ? "No notes yet" : "No results found"}
            </h2>
            <p className="text-sm text-[#6b7280]">
              {notes.length === 0
                ? "No notes have been added for this semester."
                : "Try different search terms."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotes.map((note) => (
              <Link
                key={note.id}
                to={`/notes/${note.id}`}
                className="group bg-white rounded-xl border border-[#e5e7eb] hover:border-[#d1d5db] hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
              >
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="inline-flex items-center justify-center w-9 h-9 bg-[#f3f4f6] rounded-xl">
                        <FileText className="h-4 w-4 text-teal-600" />
                      </div>
                      <span className="px-2.5 py-1 bg-[#f3f4f6] text-[#374151] text-xs font-semibold rounded-full font-mono">
                        {note.subjects?.code}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-[#0a0a0a] group-hover:text-[#374151] transition-colors line-clamp-2 mb-2">
                    {note.title}
                  </h2>

                  <p className="text-sm text-[#6b7280] line-clamp-3 flex-1 mb-4">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: stripHtmlAndTruncate(note.content, 150),
                      }}
                    />
                  </p>

                  <div className="border-t border-[#e5e7eb] pt-3 flex items-center justify-between">
                    <span className="text-xs text-[#6b7280] flex items-center gap-1 truncate">
                      <BookOpen className="h-3 w-3 text-gray-500] shrink-0" />
                      <span className="truncate">{note.subjects?.title}</span>
                    </span>
                    <span className="text-xs text-gray-500] flex items-center gap-1 shrink-0">
                      <MessageCircle className="h-3 w-3" />
                      {note.comment_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
