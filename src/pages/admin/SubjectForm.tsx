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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isEditing ? "Edit Subject" : "Add New Subject"}
            </h1>
            <p className="text-blue-100">
              {isEditing
                ? "Update subject information"
                : "Create a new subject for the curriculum"}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/admin/subjects")}
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subjects
            </button>
            <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Subject Details</h2>
          <p className="text-sm text-gray-600 mt-1">
            Fill in the information below to {isEditing ? "update" : "create"}{" "}
            the subject.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subject Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={subject.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
                  placeholder="e.g., Introduction to Computer Science"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subject Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={subject.code}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
                  placeholder="e.g., CS101"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={subject.description}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
                placeholder="Enter a detailed description of the subject..."
                required
              />
            </div>

            <div>
              <label
                htmlFor="semester_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Semester <span className="text-red-500">*</span>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
                required
              >
                <option value="" disabled>
                  Select a semester
                </option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={subject.is_active ?? true}
                  onChange={(e) =>
                    setSubject((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors duration-200"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Active Subject
                </span>
              </label>
              <p className=" text-gray-500 mt-1 ml-8">
                Inactive subjects will be hidden from students
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/admin/subjects")}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center font-semibold ${
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
                  {isEditing ? "Update Subject" : "Create Subject"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSubjectForm;
