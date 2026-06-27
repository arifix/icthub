import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Search, ChevronDown, Clock, BookOpen, MessageCircle, ChevronRight } from "lucide-react";
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
          .select(`*, subjects:subject_id (title, code), semester:semesters!inner(id, name, is_current)`)
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
            })
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
    const matchesSubject = selectedSubject === "" || note.subject_id === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Notes</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Study Notes</h1>
          <p className="text-white/70 mt-1 text-sm">Browse and search through study materials for the current semester</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, content or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : "")}
              className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.title} ({s.code})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {!loading && (
            <span className="text-sm text-gray-500 self-center whitespace-nowrap">
              {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-700 border-t-transparent" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              {notes.length === 0 ? "No notes yet" : "No results found"}
            </h2>
            <p className="text-sm text-gray-500">
              {notes.length === 0 ? "No notes have been added for this semester." : "Try different search terms."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotes.map((note) => (
              <Link
                key={note.id}
                to={`/notes/${note.id}`}
                className="group bg-white border border-gray-200 hover:border-primary-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
              >
                <div className="h-1 bg-primary-700" />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className=" font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded uppercase">
                      {note.subjects?.code}
                    </span>
                    <span className=" text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-2 mb-2">
                    {note.title}
                  </h2>

                  <p className=" text-gray-500 line-clamp-3 flex-1 mb-4">
                    <span dangerouslySetInnerHTML={{ __html: stripHtmlAndTruncate(note.content, 150) }} />
                  </p>

                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <span className=" text-gray-500 flex items-center gap-1 truncate">
                      <BookOpen className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="truncate">{note.subjects?.title}</span>
                    </span>
                    <span className=" text-gray-400 flex items-center gap-1 shrink-0">
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
