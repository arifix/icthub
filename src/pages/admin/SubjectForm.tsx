import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";

type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Semester = Database["public"]["Tables"]["semesters"]["Row"];

const AdminSubjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [subject, setSubject] = useState<Partial<Subject>>({
    title: "",
    code: "",
    description: "",
    is_active: true,
    semester_id: null,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  useEffect(() => {
    fetchSemesters();
    if (isEditing) {
      fetchSubject();
    }
  }, [id]);

  const fetchSubject = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      setSubject(
        data || {
          title: "",
          code: "",
          description: "",
          is_active: true,
          semester_id: null,
        },
      );
    } catch (error) {
      console.error("Error fetching subject:", error);
      toast.error("Failed to load subject");
      navigate("/admin/subjects");
    } finally {
      setLoading(false);
    }
  };

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setSubject((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.title || !subject.code || !subject.description) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);

      if (isEditing) {
        const { error } = await supabase
          .from("subjects")
          .update({
            title: subject.title,
            code: subject.code,
            description: subject.description,
            is_active: subject.is_active ?? true,
            semester_id: subject.semester_id ?? null,
          })
          .eq("id", id!);

        if (error) throw error;
        toast.success("Subject updated successfully");
      } else {
        const { error } = await supabase.from("subjects").insert([
          {
            title: subject.title,
            code: subject.code,
            description: subject.description,
            is_active: subject.is_active ?? true,
            semester_id: subject.semester_id ?? null,
          },
        ]);

        if (error) throw error;
        toast.success("Subject created successfully");
      }

      navigate("/admin/subjects");
    } catch (error) {
      console.error("Error saving subject:", error);
      toast.error(`Failed to ${isEditing ? "update" : "create"} subject`);
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
              {isEditing ? "Edit Subject" : "New Subject"}
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              {isEditing
                ? "Update subject information"
                : "Create a new subject for the curriculum"}
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/subjects")}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Subjects
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-[#e5e7eb]">
          <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#374151]" />
            <span className="text-sm font-bold text-black">
              Subject Details
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  Subject Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={subject.title}
                  onChange={handleChange}
                  placeholder="e.g., Introduction to Computer Science"
                  required
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
                />
              </div>

              <div>
                <label
                  htmlFor="code"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  Subject Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={subject.code}
                  onChange={handleChange}
                  placeholder="e.g., CSE 4100"
                  required
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
              >
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={subject.description}
                onChange={handleChange}
                rows={5}
                placeholder="Enter a description of the subject…"
                required
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151] resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="semester_id"
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
              >
                Semester <span className="text-red-400">*</span>
              </label>
              <select
                id="semester_id"
                name="semester_id"
                value={subject.semester_id ?? ""}
                onChange={(e) =>
                  setSubject((prev) => ({
                    ...prev,
                    semester_id: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
                required
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white text-[#374151]"
              >
                <option value="" disabled>
                  Select a semester
                </option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={subject.is_active ?? true}
                onChange={(e) =>
                  setSubject((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="h-4 w-4 mt-0.5 rounded border-[#d1d5db] text-black focus:ring-black"
              />
              <div>
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-[#374151] cursor-pointer"
                >
                  Active Subject
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Inactive subjects are hidden from students
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/admin/subjects")}
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
                    {isEditing ? "Update Subject" : "Create Subject"}
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

export default AdminSubjectForm;
