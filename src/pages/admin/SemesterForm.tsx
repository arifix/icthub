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
        },
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              {isEditing ? "Edit Semester" : "New Semester"}
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              {isEditing
                ? "Update semester information"
                : "Create a new academic semester"}
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/semesters")}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Semesters
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-[#e5e7eb]">
          <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#374151]" />
            <span className="text-sm font-bold text-black">
              Semester Details
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
              >
                Semester Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={semester.name}
                onChange={handleChange}
                placeholder="e.g., January 2026, July 2026"
                required
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="start_date"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  Start Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={semester.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
                />
              </div>
              <div>
                <label
                  htmlFor="end_date"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  End Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={semester.end_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
              <input
                type="checkbox"
                id="is_current"
                name="is_current"
                checked={semester.is_current ?? false}
                onChange={handleChange}
                className="h-4 w-4 mt-0.5 rounded border-[#d1d5db] text-black focus:ring-black"
              />
              <div>
                <label
                  htmlFor="is_current"
                  className="text-sm font-medium text-[#374151] cursor-pointer"
                >
                  Set as Current Semester
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Only one semester can be current. Other semesters will become
                  inactive.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/admin/semesters")}
                className="px-4 py-2.5 text-sm font-medium text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-black text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? "Update Semester" : "Create Semester"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSemesterForm;
