import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Edit,
  Plus,
  Search,
  Trash,
  CheckCircle,
  Clock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";

type Semester = Database["public"]["Tables"]["semesters"]["Row"];

const AdminSemesters: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    document.title = "Semesters — ICTHub Admin";
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("semesters")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setSemesters(data || []);
    } catch (error) {
      console.error("Error fetching semesters:", error);
      toast.error("Failed to load semesters");
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrent = async (id: number) => {
    if (
      window.confirm(
        "Are you sure you want to set this as the current semester?",
      )
    ) {
      try {
        setIsUpdating(true);
        // Note: Due to TypeScript constraints, use the semester edit form to set is_current
        const { error } = await supabase
          .from("semesters")
          .update({ is_current: true })
          .eq("id", id);

        if (error) throw error;

        await fetchSemesters();
        toast.success("Current semester updated successfully");
      } catch (error) {
        console.error("Error updating current semester:", error);
        toast.error("Failed to update current semester");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDelete = async (id: number) => {
    const semester = semesters.find((s) => s.id === id);
    if (semester?.is_current) {
      toast.error("Cannot delete the current semester");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to delete this semester? This will affect all related content.",
      )
    ) {
      try {
        setIsDeleting(true);
        const { error } = await supabase
          .from("semesters")
          .delete()
          .eq("id", id);

        if (error) throw error;

        setSemesters(semesters.filter((semester) => semester.id !== id));
        toast.success("Semester deleted successfully");
      } catch (error) {
        console.error("Error deleting semester:", error);
        toast.error("Failed to delete semester");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const filteredSemesters = semesters.filter((semester) =>
    semester.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight">
              Semesters
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Manage academic semesters and set the active one
            </p>
          </div>
          <Link
            to="/admin/semesters/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] text-white rounded-lg text-sm font-medium hover:bg-[#374151] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Semester
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Search */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] px-6 py-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search semesters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] text-[#374151]"
            />
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
              <Calendar className="h-4 w-4 text-[#374151]" />
              <span className="text-sm font-bold text-[#0a0a0a]">
                Semesters
              </span>
              <span className="ml-auto text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                {filteredSemesters.length}{" "}
                {filteredSemesters.length !== semesters.length &&
                  `/ ${semesters.length}`}
              </span>
            </div>
            {filteredSemesters.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-[#f3f4f6] p-3 rounded-xl w-fit mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-[#9ca3af]" />
                </div>
                <p className="text-sm font-semibold text-[#374151]">
                  {semesters.length === 0
                    ? "No semesters yet"
                    : "No semesters match your search"}
                </p>
                {semesters.length === 0 && (
                  <Link
                    to="/admin/semesters/new"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] text-white rounded-lg text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Create Semester
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      {["Name", "Start", "End", "Status", ""].map((h) => (
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
                    {filteredSemesters.map((semester) => (
                      <tr key={semester.id} className="hover:bg-[#f9fafb]">
                        <td className="px-5 py-3">
                          <p className="font-medium text-[#374151]">
                            {semester.name}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#6b7280]">
                          {formatDate(semester.start_date)}
                        </td>
                        <td className="px-5 py-3 text-xs text-[#6b7280]">
                          {formatDate(semester.end_date)}
                        </td>
                        <td className="px-5 py-3">
                          {semester.is_current ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#f0fdf4] text-[#16a34a] px-2 py-0.5 rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              Current
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetCurrent(semester.id)}
                              disabled={isUpdating}
                              className="text-xs text-[#6b7280] hover:text-[#0a0a0a] font-medium disabled:opacity-50"
                            >
                              Set as current
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Link
                              to={`/admin/semesters/${semester.id}`}
                              className="p-1.5 text-[#374151] hover:text-[#0a0a0a] hover:bg-[#f3f4f6] rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            {!semester.is_current && (
                              <button
                                onClick={() => handleDelete(semester.id)}
                                disabled={isDeleting}
                                className="p-1.5 text-[#6b7280] hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            )}
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

export default AdminSemesters;
