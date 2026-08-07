import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";

type InfoNote = Database["public"]["Tables"]["info_notes"]["Row"];
type InfoCategory = Database["public"]["Tables"]["info_categories"]["Row"];

const AdminInfoNoteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [note, setNote] = useState<Partial<InfoNote>>({
    title: "",
    content: "",
    category_id: undefined,
    sort_order: 0,
    is_active: true,
  });
  const [categories, setCategories] = useState<InfoCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isEditing) fetchNote();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("info_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching info categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchNote = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("info_notes")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      setNote(
        data || {
          title: "",
          content: "",
          category_id: undefined,
          sort_order: 0,
          is_active: true,
        },
      );
    } catch (error) {
      console.error("Error fetching info note:", error);
      toast.error("Failed to load note");
      navigate("/admin/info-notes");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "category_id" || name === "sort_order") {
      setNote((prev) => ({
        ...prev,
        [name]: value ? Number(value) : undefined,
      }));
    } else {
      setNote((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!note.title || !note.content || !note.category_id) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: note.title,
        content: note.content,
        category_id: note.category_id,
        sort_order: note.sort_order ?? 0,
        is_active: note.is_active ?? true,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("info_notes")
          .update(payload)
          .eq("id", id!);
        if (error) throw error;
        toast.success("Note updated successfully");
      } else {
        const { error } = await supabase.from("info_notes").insert([payload]);
        if (error) throw error;
        toast.success("Note created successfully");
      }

      navigate("/admin/info-notes", { state: { refresh: true } });
    } catch (error) {
      console.error("Error saving info note:", error);
      toast.error(`Failed to ${isEditing ? "update" : "create"} note`);
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
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              {isEditing ? "Edit Note" : "New Note"}
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Add a concise note under an info category
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/info-notes")}
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
            <span className="text-sm font-bold text-black">
              Note Details
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label
                htmlFor="title"
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
              >
                Note Title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                name="title"
                value={note.title ?? ""}
                onChange={handleChange}
                placeholder="e.g., Attendance policy"
                required
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
              />
            </div>

            <div>
              <label
                htmlFor="category_id"
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
              >
                Category <span className="text-red-400">*</span>
              </label>
              <select
                id="category_id"
                name="category_id"
                value={note.category_id ?? ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white text-[#374151]"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
              >
                Note Content <span className="text-red-400">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={note.content ?? ""}
                onChange={handleChange}
                rows={6}
                placeholder="Write the short note here..."
                required
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="sort_order"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  Sort Order
                </label>
                <input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  value={note.sort_order ?? 0}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={note.is_active ?? true}
                  onChange={(e) =>
                    setNote((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-[#d1d5db] text-black focus:ring-black"
                />
                <label htmlFor="is_active" className="text-sm text-[#374151]">
                  Visible on public info page
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/admin/info-notes")}
                className="px-4 py-2 text-sm text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-[#374151] transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Update Note"
                    : "Create Note"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminInfoNoteForm;
