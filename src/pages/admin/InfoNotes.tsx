import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Edit, FileText, Plus, Search, Trash, Info } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";

type InfoNote = Database["public"]["Tables"]["info_notes"]["Row"];
type InfoCategory = Database["public"]["Tables"]["info_categories"]["Row"];

const AdminInfoNotes: React.FC = () => {
  const [notes, setNotes] = useState<InfoNote[]>([]);
  const [categories, setCategories] = useState<InfoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [isDeleting, setIsDeleting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.title = "Information Notes — ICTHub Admin";
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchData();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notesRes, categoriesRes] = await Promise.all([
        supabase
          .from("info_notes")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("info_categories")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (notesRes.error) throw notesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setNotes(notesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Error fetching info notes:", error);
      toast.error("Failed to load info notes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase.from("info_notes").delete().eq("id", id);
      if (error) throw error;
      setNotes(notes.filter((note) => note.id !== id));
      toast.success("Note deleted successfully");
    } catch (error) {
      console.error("Error deleting info note:", error);
      toast.error("Failed to delete note");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const category = categories.find((item) => item.id === note.category_id);
    const matchesSearch =
      `${note.title} ${note.content} ${category?.name ?? ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "" || note.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight">
              Information Notes
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Create the short notes that appear inside each info category
            </p>
          </div>
          <Link
            to="/admin/info-notes/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] text-white rounded-lg text-sm font-medium hover:bg-[#374151] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Note
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-[#e5e7eb] px-6 py-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] text-[#374151]"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value ? Number(e.target.value) : "")
            }
            className="px-3 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] bg-white appearance-none cursor-pointer text-[#374151]"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a0a0a] border-t-transparent" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
            <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-[#374151]" />
              <span className="text-sm font-bold text-[#0a0a0a]">Notes</span>
              <span className="ml-auto text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                {filteredNotes.length}
              </span>
            </div>
            {filteredNotes.length === 0 ? (
              <div className="text-center py-16 px-6">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#374151]">
                  {notes.length === 0 ? "No notes yet" : "No results found"}
                </p>
                <p className="text-sm text-[#6b7280] mt-1">
                  Add concise notes under each category.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#e5e7eb]">
                {filteredNotes.map((note) => {
                  const category = categories.find(
                    (item) => item.id === note.category_id,
                  );
                  return (
                    <div
                      key={note.id}
                      className="px-6 py-4 flex flex-col gap-4 hover:bg-[#f9fafb] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-[#0a0a0a]">
                              {note.title}
                            </h3>
                            <span className="text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                              {category?.name ?? "Unassigned"}
                            </span>
                          </div>
                          <p className="text-sm text-[#6b7280] whitespace-pre-line">
                            {note.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/info-notes/${note.id}`}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(note.id)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <Trash className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInfoNotes;
