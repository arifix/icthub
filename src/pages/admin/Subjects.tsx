import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  useEffect(() => {
    document.title = "Subjects — ICTHub Admin";
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
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              Subjects
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Add, edit, or remove subjects from the curriculum
            </p>
          </div>
          <Link
            to="/admin/subjects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-[#374151] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Subject
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] px-6 py-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
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
                className="pl-3 pr-8 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white appearance-none cursor-pointer text-[#374151]"
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
            {(searchTerm || selectedSemester !== "") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSemester("");
                }}
                className="px-3 py-2 text-sm text-[#6b7280] hover:text-black border border-[#e5e7eb] rounded-xl hover:bg-[#f9fafb] transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e5e7eb]">
            <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#374151]" />
              <span className="text-sm font-bold text-black">Subjects</span>
              <span className="ml-auto text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                {filteredSubjects.length}{" "}
                {filteredSubjects.length !== subjects.length &&
                  `/ ${subjects.length}`}
              </span>
            </div>
            {filteredSubjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-[#f3f4f6] p-3 rounded-xl w-fit mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-sm font-semibold text-[#374151]">
                  {subjects.length === 0
                    ? "No subjects yet"
                    : "No subjects match your filters"}
                </p>
                {subjects.length === 0 && (
                  <Link
                    to="/admin/subjects/new"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Subject
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      {["Title", "Code", "Semester", "Status", "Date", ""].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {filteredSubjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-[#f9fafb]">
                        <td className="px-5 py-3">
                          <p className="font-medium text-[#374151] truncate max-w-[220px]">
                            {subject.title}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-semibold text-[#374151] px-2.5 py-1 rounded-full font-mono">
                            {subject.code}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#6b7280]">
                          {subject.semesters?.name || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              subject.is_active
                                ? "bg-[#f0fdf4] text-[#16a34a]"
                                : "bg-[#fef2f2] text-[#dc2626]"
                            }`}
                          >
                            {subject.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(subject.created_at).toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Link
                              to={`/admin/subjects/${subject.id}`}
                              className="p-1.5 text-[#374151] hover:text-black hover:bg-[#f3f4f6] rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(subject.id)}
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

export default AdminSubjects;
