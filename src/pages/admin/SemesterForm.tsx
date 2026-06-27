import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";

type Semester = Database["public"]["Tables"]["semesters"]["Row"];

const AdminSemesterForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [semester, setSemester] = useState<Partial<Semester>>({
    name: "",
    start_date: "",
    end_date: "",
    is_current: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchSemester();
    }
  }, [id]);

  const fetchSemester = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("semesters")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      setSemester(
        data || {
          name: "",
          start_date: "",
          end_date: "",
          is_current: false,
        }
      );
    } catch (error) {
      console.error("Error fetching semester:", error);
      toast.error("Failed to load semester");
      navigate("/admin/semesters");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSemester((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!semester.name || !semester.start_date || !semester.end_date) {
      toast.error("Please fill all required fields");
      return;
    }

    if (new Date(semester.start_date) >= new Date(semester.end_date)) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      setSaving(true);

      if (isEditing) {
        const { error } = await supabase
          .from("semesters")
          .update({
            name: semester.name,
            start_date: semester.start_date,
            end_date: semester.end_date,
            is_current: semester.is_current,
          })
          .eq("id", id!);

        if (error) throw error;
        toast.success("Semester updated successfully");
      } else {
        const { error } = await supabase.from("semesters").insert([
          {
            name: semester.name,
            start_date: semester.start_date,
            end_date: semester.end_date,
            is_current: semester.is_current,
          },
        ]);

        if (error) throw error;
        toast.success("Semester created successfully");
      }

      navigate("/admin/semesters");
    } catch (error) {
      console.error("Error saving semester:", error);
      toast.error(`Failed to ${isEditing ? "update" : "create"} semester`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isEditing ? "Edit Semester" : "Add New Semester"}
            </h1>
            <p className="text-indigo-100">
              {isEditing
                ? "Update semester information"
                : "Create a new academic semester"}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/admin/semesters")}
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Semesters
            </button>
            <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Semester Details
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Fill in the information below to {isEditing ? "update" : "create"}{" "}
            the semester.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Semester Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={semester.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
                placeholder="e.g., Spring 2025, Fall 2025"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="start_date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={semester.start_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="end_date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={semester.end_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
                  required
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="is_current"
                  checked={semester.is_current ?? false}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 transition-colors duration-200"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Set as Current Semester
                </span>
              </label>
              <p className=" text-gray-500 mt-1 ml-8">
                Only one semester can be current at a time. Setting this will
                make other semesters inactive.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/admin/semesters")}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center font-semibold ${
                saving ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  {isEditing ? "Update Semester" : "Create Semester"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSemesterForm;
