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
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Manage Semesters
            </h1>
            <p className="text-indigo-100">
              Create and manage academic semesters. Set the current semester to
              control displayed content
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/semesters/new"
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Semester
            </Link>
            <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[300px]">
            <label
              htmlFor="search"
              className="block font-semibold text-gray-700 mb-2"
            >
              Search Semesters
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search by semester name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredSemesters.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Semesters Found
          </h3>
          <p className="text-gray-600 mb-6">
            {semesters.length === 0
              ? "Start by creating your first semester to organize your academic content."
              : "No semesters match your search criteria. Try adjusting your filters."}
          </p>
          {semesters.length === 0 && (
            <Link
              to="/admin/semesters/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Semester
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSemesters.map((semester) => (
            <div
              key={semester.id}
              className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border hover:shadow-xl transition-all duration-300 overflow-hidden group ${
                semester.is_current
                  ? "border-green-400 bg-green-50/50"
                  : "border-gray-100"
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-200 ${
                      semester.is_current
                        ? "bg-gradient-to-br from-green-500 to-emerald-600"
                        : "bg-gradient-to-br from-indigo-500 to-purple-600"
                    }`}
                  >
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-2">
                    {semester.is_current ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full  font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Current
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full  font-medium bg-gray-100 text-gray-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
                    {semester.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Start:</span>{" "}
                      {formatDate(semester.start_date)}
                    </div>
                    <div>
                      <span className="font-medium">End:</span>{" "}
                      {formatDate(semester.end_date)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {!semester.is_current && (
                    <button
                      onClick={() => handleSetCurrent(semester.id)}
                      disabled={isUpdating}
                      className="text-sm text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                    >
                      Set as Current
                    </button>
                  )}
                  <div className="flex space-x-2 ml-auto">
                    <Link
                      to={`/admin/semesters/${semester.id}`}
                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    {!semester.is_current && (
                      <button
                        onClick={() => handleDelete(semester.id)}
                        disabled={isDeleting}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
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

export default AdminSemesters;
