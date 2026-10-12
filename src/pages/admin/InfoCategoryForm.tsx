import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Info, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";
import { AdminFormSection, AdminPageHeader } from "../../components/AdminUI";

type InfoCategory = Database["public"]["Tables"]["info_categories"]["Row"];

const AdminInfoCategoryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [category, setCategory] = useState<Partial<InfoCategory>>({
    name: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("info_categories")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      setCategory(
        data || { name: "", description: "", sort_order: 0, is_active: true },
      );
    } catch (error) {
      console.error("Error fetching info category:", error);
      toast.error("Failed to load category");
      navigate("/admin/info-categories");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCategory((prev) => ({
      ...prev,
      [name]: name === "sort_order" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category.name) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: category.name,
        description: category.description || "",
        sort_order: category.sort_order ?? 0,
        is_active: category.is_active ?? true,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("info_categories")
          .update(payload)
          .eq("id", id!);
        if (error) throw error;
        toast.success("Category updated successfully");
      } else {
        const { error } = await supabase
          .from("info_categories")
          .insert([payload]);
        if (error) throw error;
        toast.success("Category created successfully");
      }

      navigate("/admin/info-categories", { state: { refresh: true } });
    } catch (error) {
      console.error("Error saving info category:", error);
      toast.error(`Failed to ${isEditing ? "update" : "create"} category`);
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
      <AdminPageHeader title={isEditing ? "Edit Info Category" : "New Info Category"} description="Create a section for info notes like academic, rules, or tips" action={<button onClick={() => navigate("/admin/info-categories")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Back to Categories</button>} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <AdminFormSection title="Category details" description="Create a clear section label and decide where it appears in the information hub." icon={Info}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                htmlFor="name"
              >
                Category Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                value={category.name ?? ""}
                onChange={handleChange}
                placeholder="e.g., Academic"
                required
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                htmlFor="description"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={category.description ?? ""}
                onChange={handleChange}
                rows={4}
                placeholder="Short description for the section"
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                  htmlFor="sort_order"
                >
                  Sort Order
                </label>
                <input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  value={category.sort_order ?? 0}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={category.is_active ?? true}
                  onChange={(e) =>
                    setCategory((prev) => ({
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

            <div className="admin-form-actions flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/admin/info-categories")}
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
                    ? "Update Category"
                    : "Create Category"}
              </button>
            </div>
          </form>
        </AdminFormSection>
      </div>
    </div>
  );
};

export default AdminInfoCategoryForm;
