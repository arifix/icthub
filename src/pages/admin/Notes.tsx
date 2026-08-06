import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Edit,
  FileText,
  Plus,
  Search,
  Trash,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";

type Note = Database["public"]["Tables"]["notes"]["Row"] & {
  subjects: { title: string; code: string };
  semesters?: { name: string } | null;
};
type Semester = Database["public"]["Tables"]["semesters"]["Row"];

const AdminNotes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [isDeleting, setIsDeleting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.title = "Notes — ICTHub Admin";
    fetchData();
  }, []);

  // Refresh data when returning from note form
  useEffect(() => {
    if (location.state?.refresh) {
      fetchData();
      // Clear the state to prevent unnecessary re-fetches
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        { data: notesData, error: notesError },
        { data: semestersData, error: semestersError },
      ] = await Promise.all([
        supabase
          .from("notes")
          .select(
            `
            *,
            subjects:subject_id (title, code),
            semesters:semester_id (name)
          `,
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("semesters")
          .select("*")
          .order("name", { ascending: true }),
      ]);

      if (notesError) throw notesError;
      if (semestersError) throw semestersError;

      setNotes(notesData || []);
      setSemesters(semestersData || []);

      // Set current semester as default
      const currentSemester = semestersData?.find((s) => s.is_current);
      if (currentSemester) {
        setSelectedSemester(currentSemester.id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        setIsDeleting(true);
        const { error } = await supabase.from("notes").delete().eq("id", id);

        if (error) throw error;

        setNotes(notes.filter((note) => note.id !== id));
        toast.success("Note deleted successfully");
      } catch (error) {
        console.error("Error deleting note:", error);
        toast.error("Failed to delete note");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.subjects?.title &&
        note.subjects.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (note.subjects?.code &&
        note.subjects.code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSemester =
      selectedSemester === "" || note.semester_id === selectedSemester;

    return matchesSearch && matchesSemester;
  });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight">
              Notes
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Create, edit, and organize study notes
            </p>
          </div>
          <Link
            to="/admin/notes/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] text-white rounded-lg text-sm font-medium hover:bg-[#374151] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Note
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] px-6 py-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500]" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] text-[#374151]"
              />
            </div>
            <div className="relative">
              <select
                value={selectedSemester}
                onChange={(e) =>
                  setSelectedSemester(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="pl-3 pr-8 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] bg-white appearance-none cursor-pointer text-[#374151]"
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500] pointer-events-none" />
            </div>
            {(searchTerm || selectedSemester !== "") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSemester("");
                }}
                className="px-3 py-2 text-sm text-[#6b7280] hover:text-[#0a0a0a] border border-[#e5e7eb] rounded-xl hover:bg-[#f9fafb] transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a0a0a] border-t-transparent" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e5e7eb]">
            <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#374151]" />
              <span className="text-sm font-bold text-[#0a0a0a]">Notes</span>
              <span className="ml-auto text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                {filteredNotes.length}{" "}
                {filteredNotes.length !== notes.length && `/ ${notes.length}`}
              </span>
            </div>
            {filteredNotes.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-[#f3f4f6] p-3 rounded-xl w-fit mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-500]" />
                </div>
                <p className="text-sm font-semibold text-[#374151]">
                  {notes.length === 0
                    ? "No notes yet"
                    : "No notes match your filters"}
                </p>
                {notes.length === 0 && (
                  <Link
                    to="/admin/notes/new"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] text-white rounded-lg text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Note
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      {["Title", "Subject", "Semester", "Date", ""].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {filteredNotes.map((note) => (
                      <tr key={note.id} className="hover:bg-[#f9fafb]">
                        <td className="px-5 py-3">
                          <p className="font-medium text-[#374151] truncate max-w-[260px]">
                            {note.title}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          {note.subjects ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[#374151] font-semibold px-2 py-0.5 truncate">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {note.subjects.title} ({note.subjects.code})
                            </span>
                          ) : (
                            <span className="text-gray-500]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-[#6b7280]">
                          {note.semesters?.name || "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500] whitespace-nowrap">
                          {formatDate(note.created_at)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Link
                              to={`/admin/notes/${note.id}`}
                              className="p-1.5 text-[#374151] hover:text-[#0a0a0a] hover:bg-[#f3f4f6] rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(note.id)}
                              disabled={isDeleting}
                              className="p-1.5 text-[#6b7280] hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotes;
