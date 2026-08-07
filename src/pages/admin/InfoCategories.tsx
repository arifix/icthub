import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Edit, FileText, Plus, Search, Trash, Info } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";

type InfoCategory = Database["public"]["Tables"]["info_categories"]["Row"];

const AdminInfoCategories: React.FC = () => {
  const [categories, setCategories] = useState<InfoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.title = "Information Categories — ICTHub Admin";
    fetchCategories();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchCategories();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("info_categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching info categories:", error);
      toast.error("Failed to load info categories");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category? This will also remove its notes.",
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("info_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setCategories(categories.filter((category) => category.id !== id));
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting info category:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    `${category.name} ${category.description}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              Information Categories
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Create and organize the information sections shown on the public
              page
            </p>
          </div>
          <Link
            to="/admin/info-categories/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-[#374151] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Category
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-[#e5e7eb] px-6 py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
            <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-[#374151]" />
              <span className="text-sm font-bold text-black">
                Categories
              </span>
              <span className="ml-auto text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                {filteredCategories.length}
              </span>
            </div>
            {filteredCategories.length === 0 ? (
              <div className="text-center py-16 px-6">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#374151]">
                  {categories.length === 0
                    ? "No categories yet"
                    : "No results found"}
                </p>
                <p className="text-sm text-[#6b7280] mt-1">
                  Add categories like academic, rules, study, or tips.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#e5e7eb]">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#f9fafb] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-black">
                          {category.name}
                        </h3>
                        <span className="text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                          Order {category.sort_order}
                        </span>
                      </div>
                      <p className="text-sm text-[#6b7280]">
                        {category.description || "No description"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/info-categories/${category.id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(category.id)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInfoCategories;
