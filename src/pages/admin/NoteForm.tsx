import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { createNotification } from "../../utils/notifications";

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
        data || { title: "", content: "", subject_id: undefined, summary: "" }
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
        .select(`
          *,
          semester:semesters(id, name, is_current)
        `)
        .eq("is_active", true)
        .order("title", { ascending: true });

      if (error) throw error;
      
      // Filter for current semester subjects only
      const currentSemesterSubjects = data?.filter(
        (subject: Subject & { semester?: { is_current: boolean } }) => 
          subject.semester?.is_current === true
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
    >
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
        `
          )
          .single();

        if (error) throw error;
        toast.success("Note created successfully");

        // Create in-app notification for new note
        if (newNote) {
          try {
            await createNotification({
              type: "note",
              title: newNote.title,
              message: `New study note added${
                newNote.subjects ? ` for ${newNote.subjects.title}` : ""
              }`,
              related_id: newNote.id,
              semester_id: newNote.semester_id,
              subject_id: newNote.subject_id,
              created_by: "Admin",
            });
          } catch (notificationError) {
            console.error("Failed to create notification:", notificationError);
            // Don't show error to user as the main action succeeded
          }
        }
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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isEditing ? "Edit Note" : "Add New Note"}
            </h1>
            <p className="text-emerald-100">
              {isEditing
                ? "Update note content and information"
                : "Create a new study note for students"}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/admin/notes")}
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </button>
            <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Note Details</h2>
          <p className="text-sm text-gray-600 mt-1">
            Fill in the information below to {isEditing ? "update" : "create"}{" "}
            the note.
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
                  Note Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={note.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200"
                  placeholder="e.g., Introduction to Variables"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="subject_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subject <span className="text-red-500">*</span>
                </label>
                {loadingSubjects ? (
                  <div className="flex items-center h-12 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-emerald-600 mr-2"></div>
                    <span className="text-sm text-gray-500">
                      Loading subjects...
                    </span>
                  </div>
                ) : (
                  <select
                    id="subject_id"
                    name="subject_id"
                    value={note.subject_id || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200"
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code}: {subject.title}
                      </option>
                    ))}
                  </select>
                )}
                {subjects.length === 0 && !loadingSubjects && (
                  <p className="mt-2 text-sm text-red-500">
                    No subjects available. Please add a subject first.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="summary"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Summary
              </label>
              <textarea
                id="summary"
                name="summary"
                value={note.summary}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200"
                rows={3}
                placeholder="Enter a brief summary of the note (optional)"
              />
              <p className=" text-gray-500 mt-1">
                This summary will be displayed prominently to help students
                understand the note's content
              </p>
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Content <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <ReactQuill
                  id="content"
                  name="content"
                  value={note.content}
                  onChange={(content) =>
                    setNote((prev) => ({ ...prev, content }))
                  }
                  theme="snow"
                  className="h-64 lg:h-96"
                  placeholder="Enter the note content..."
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
          </div>

          <div className="mt-20 lg:mt-16 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/admin/notes")}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || subjects.length === 0}
              className={`px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center font-semibold ${
                saving || subjects.length === 0
                  ? "opacity-70 cursor-not-allowed"
                  : ""
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
                  {isEditing ? "Update Note" : "Create Note"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminNoteForm;
