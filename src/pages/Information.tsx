import React, { useEffect, useMemo, useState } from "react";
import { Info, BookOpen, ChevronRight, FileText } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";

type InfoCategory = Database["public"]["Tables"]["info_categories"]["Row"];
type InfoNote = Database["public"]["Tables"]["info_notes"]["Row"];

const InformationPage: React.FC = () => {
  const [categories, setCategories] = useState<InfoCategory[]>([]);
  const [notes, setNotes] = useState<InfoNote[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, notesRes] = await Promise.all([
          supabase
            .from("info_categories")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),
          supabase
            .from("info_notes")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (notesRes.error) throw notesRes.error;

        const categoryRows = categoriesRes.data || [];
        setCategories(categoryRows);
        setNotes(notesRes.data || []);
        setSelectedCategoryId(categoryRows[0]?.id ?? null);
        document.title = "Information — ICTHub";
      } catch (error) {
        console.error("Error fetching info data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedCategory = useMemo(
    () =>
      categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const selectedNotes = useMemo(
    () => notes.filter((note) => note.category_id === selectedCategoryId),
    [notes, selectedCategoryId],
  );

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight mb-1">
            Information Center
          </h1>
          <p className="text-sm text-[#6b7280]">
            Browse academic updates, rules, study guidance, and quick tips.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a0a0a] border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-12 text-center">
            <Info className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-base font-semibold text-[#374151] mb-1">
              No info added yet
            </h2>
            <p className="text-sm text-[#6b7280]">
              Admins can add categories and notes from the admin panel.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-2 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    selectedCategoryId === category.id
                      ? "bg-[#0a0a0a] text-white"
                      : "bg-[#f9fafb] text-[#374151] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1">
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 bg-[#f3f4f6] rounded-xl flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-[#374151]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#0a0a0a]">
                      {selectedCategory?.name}
                    </h2>
                    <p className="text-xs text-[#6b7280]">
                      {selectedCategory?.description}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedNotes.length === 0 ? (
                    <p className="text-sm text-[#6b7280]">
                      No notes in this category yet.
                    </p>
                  ) : (
                    selectedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-xl border border-[#e5e7eb] p-4 bg-[#f9fafb]"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-[#374151]" />
                          <h3 className="text-sm font-bold text-[#0a0a0a]">
                            {note.title}
                          </h3>
                        </div>
                        <p className="text-sm text-[#374151] whitespace-pre-line leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InformationPage;
