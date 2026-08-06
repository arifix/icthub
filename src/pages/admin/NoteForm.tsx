import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

type Note = Database["public"]["Tables"]["notes"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];

const AdminNoteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [note, setNote] = useState<Partial<Note>>({
    title: "",
    content: "",
    subject_id: undefined,
    summary: "",
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    fetchSubjects();
    if (isEditing) {
      fetchNote();
    }
  }, [id]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      setNote(
        data || { title: "", content: "", subject_id: undefined, summary: "" },
      );
    } catch (error) {
      console.error("Error fetching note:", error);
      toast.error("Failed to load note");
      navigate("/admin/notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      // Only fetch subjects from current semester
      const { data, error } = await supabase
        .from("subjects")
        .select(
          `
          *,
          semester:semesters(id, name, is_current)
        `,
        )
        .eq("is_active", true)
        .order("title", { ascending: true });

      if (error) throw error;

      // Filter for current semester subjects only
      const currentSemesterSubjects =
        data?.filter(
          (subject: Subject & { semester?: { is_current: boolean } }) =>
            subject.semester?.is_current === true,
        ) || [];

      setSubjects(currentSemesterSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "subject_id") {
      setNote((prev) => ({
        ...prev,
        [name]: value ? parseInt(value) : undefined,
      }));
    } else {
      setNote((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!note.title || !note.content || !note.subject_id) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);

      const { data: semesterData, error: semesterError } = await supabase
        .from("semesters")
        .select("*")
        .eq("is_current", true)
        .single();
      if (semesterError) throw semesterError;
      const semesterId = semesterData?.id;
      if (!semesterId) {
        toast.error("No active semester found. Please set one up first.");
        return;
      }

      if (isEditing) {
        const { error } = await supabase
          .from("notes")
          .update({
            title: note.title,
            content: note.content,
            subject_id: note.subject_id,
            summary: note.summary,
            semester_id: semesterId,
          })
          .eq("id", id!);

        if (error) throw error;
        toast.success("Note updated successfully");
      } else {
        const { data: newNote, error } = await supabase
          .from("notes")
          .insert([
            {
              title: note.title,
              content: note.content,
              subject_id: note.subject_id,
              summary: note.summary,
              semester_id: semesterId,
            },
          ])
          .select(
            `
          *,
          subjects:subject_id (title, code),
          semesters:semester_id (name)
        `,
          )
          .single();

        if (error) throw error;
        toast.success("Note created successfully");
      }

      navigate("/admin/notes", { state: { refresh: true } });
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error(`Failed to ${isEditing ? "update" : "create"} note`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a0a0a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight">
              {isEditing ? "Edit Note" : "New Note"}
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              {isEditing
                ? "Update note content and information"
                : "Create a study note for students"}
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/notes")}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Notes
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-[#e5e7eb]">
          <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#374151]" />
            <span className="text-sm font-bold text-[#0a0a0a]">
              Note Details
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={note.title}
                  onChange={handleChange}
                  placeholder="e.g., Introduction to Variables"
                  required
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] text-[#374151]"
                />
              </div>

              <div>
                <label
                  htmlFor="subject_id"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  Subject <span className="text-red-400">*</span>
                </label>
                {loadingSubjects ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0a0a0a] border-t-transparent" />
                    <span className="text-sm text-gray-500]">
                      Loading subjects…
                    </span>
                  </div>
                ) : (
                  <select
                    id="subject_id"
                    name="subject_id"
                    value={note.subject_id || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] bg-white text-[#374151]"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.title}
                      </option>
                    ))}
                  </select>
                )}
                {subjects.length === 0 && !loadingSubjects && (
                  <p className="mt-1.5 text-xs text-red-500">
                    No subjects available. Add a subject first.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="summary"
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
              >
                Summary
              </label>
              <textarea
                id="summary"
                name="summary"
                value={note.summary}
                onChange={handleChange}
                rows={3}
                placeholder="Brief summary displayed to students (optional)"
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] text-[#374151] resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
              >
                Content <span className="text-red-400">*</span>
              </label>
              <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
                <ReactQuill
                  value={note.content}
                  onChange={(content) =>
                    setNote((prev) => ({ ...prev, content }))
                  }
                  theme="snow"
                  className="h-64 lg:h-96"
                  placeholder="Enter the note content…"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["blockquote", "code-block"],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-16 lg:pt-12">
              <button
                type="button"
                onClick={() => navigate("/admin/notes")}
                className="px-4 py-2.5 text-sm font-medium text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || subjects.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#0a0a0a] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? "Update Note" : "Create Note"}
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

export default AdminNoteForm;
