import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Edit, Plus, Search, Trash, ChevronDown } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";

type Subject = Database["public"]["Tables"]["subjects"]["Row"] & {
  semesters?: { name: string } | null;
};
type Semester = Database["public"]["Tables"]["semesters"]["Row"];

const AdminSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        { data: subjectsData, error: subjectsError },
        { data: semestersData, error: semestersError },
      ] = await Promise.all([
        supabase
          .from("subjects")
          .select(
            `
            *,
            semesters:semester_id (name)
          `,
          )
          .order("title", { ascending: true }),
        supabase
          .from("semesters")
          .select("*")
          .order("name", { ascending: true }),
      ]);

      if (subjectsError) throw subjectsError;
      if (semestersError) throw semestersError;

      setSubjects(subjectsData || []);
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
    if (
      window.confirm(
        "Are you sure you want to delete this subject? This will also delete all notes and files associated with it.",
      )
    ) {
      try {
        setIsDeleting(true);
        const { error } = await supabase.from("subjects").delete().eq("id", id);

        if (error) throw error;

        setSubjects(subjects.filter((subject) => subject.id !== id));
        toast.success("Subject deleted successfully");
      } catch (error) {
        console.error("Error deleting subject:", error);
        toast.error("Failed to delete subject");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSemester =
      selectedSemester === "" || subject.semester_id === selectedSemester;

    return matchesSearch && matchesSemester;
  });

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Manage Subjects
            </h1>
            <p className="text-blue-100">
              Add, edit, or remove subjects from your curriculum
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/subjects/new"
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Subject
            </Link>
            <div className="hidden lg:flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="search"
              className="block font-semibold text-gray-700 mb-2"
            >
              Search Subjects
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search by title, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="semester"
              className="block font-semibold text-gray-700 mb-2"
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
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow duration-200 appearance-none cursor-pointer"
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
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-semibold"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Subjects Found
          </h2>
          <p className="text-gray-600 mb-6">
            {subjects.length === 0
              ? "Start by adding your first subject."
              : "No subjects match your search criteria."}
          </p>
          {subjects.length === 0 && (
            <Link
              to="/admin/subjects/new"
              className="inline-flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Subject
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full  font-semibold ${
                      subject.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {subject.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                    {subject.title}
                  </h3>
                  <p className="text-sm font-semibold text-blue-600 mb-2">
                    {subject.code}
                  </p>
                  {subject.semesters && (
                    <p className="text-sm text-gray-600 font-medium mb-2">
                      {subject.semesters.name}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {subject.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className=" text-gray-500 font-medium">
                    {new Date(subject.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/admin/subjects/${subject.id}`}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(subject.id)}
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

export default AdminSubjects;
