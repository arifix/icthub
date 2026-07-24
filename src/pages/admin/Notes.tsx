import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  Edit,
  FileText,
  Plus,
  Search,
  Trash,
  Clock,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";
import { stripHtmlAndTruncate } from "../../utils/helper.js";

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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Manage Notes</h1>
            <p className="text-emerald-100">
              Create, edit, and organize study notes for your subjects
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/notes/new"
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Link>
            <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="search"
              className="block font-medium text-gray-700 mb-2"
            >
              Search Notes
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search by title, content, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="semester"
              className="block font-medium text-gray-700 mb-2"
            >
              Filter by Semester
            </label>
            <div className="relative">
              <select
                id="semester"
                value={selectedSemester}
                onChange={(e) =>
                  setSelectedSemester(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-shadow duration-200 appearance-none cursor-pointer"
              >
                <option value="">All Semesters</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedSemester("");
              }}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-xl font-medium text-gray-700">
            No notes found
          </h2>
          <p className="mt-2 text-gray-500">
            {notes.length === 0
              ? "Start by adding your first note."
              : "No notes match your search criteria."}
          </p>
          {notes.length === 0 && (
            <Link
              to="/admin/notes/new"
              className="mt-6 inline-flex items-center bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group transform hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-emerald-100 p-3 rounded-lg group-hover:bg-emerald-200 transition-colors duration-200">
                    <FileText className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(note.created_at)}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors duration-200">
                    {note.title}
                  </h3>
                  {note.subjects && (
                    <div className="flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-3 w-fit">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>{note.subjects.code}</span>
                    </div>
                  )}
                  {note.semesters && (
                    <p className="text-sm text-gray-500 mb-2">
                      {note.semesters.name}
                    </p>
                  )}
                  <p className="text-gray-600 line-clamp-3">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: stripHtmlAndTruncate(note.content, 150),
                      }}
                    ></span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {note.subjects && (
                    <div className="text-sm text-gray-600 truncate">
                      {note.subjects.title}
                    </div>
                  )}
                  <div className="flex space-x-2 ml-auto">
                    <Link
                      to={`/admin/notes/${note.id}`}
                      className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(note.id)}
                      disabled={isDeleting}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotes;
