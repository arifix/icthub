import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";

type Subject = Database["public"]["Tables"]["subjects"]["Row"] & {
  semester?: { name: string } | null;
};

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("subjects")
          .select(`*, semester:semesters(id, name, is_current)`)
          .eq("is_active", true)
          .order("title", { ascending: true });

        if (error) throw error;

        const currentSubjects =
          data?.filter(
            (subject: any) => subject.semester?.is_current === true,
          ) || [];

        setSubjects(currentSubjects);
        document.title = "Subjects — ICTHub";
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Page header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight mb-1">
            Current Semester Subjects
          </h1>
          <p className="text-sm text-[#6b7280]">
            Browse courses and study materials for this semester
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="max-w-2xl mb-8">
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-3 pl-11 border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] transition-all bg-white text-sm"
              />
            </div>
            {!loading && (
              <span className="text-sm text-[#6b7280] whitespace-nowrap">
                {filteredSubjects.length} subject
                {filteredSubjects.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0a0a0a] border-t-transparent" />
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-16 text-center">
            <BookOpen className="h-12 w-12 text-[#d1d5db] mx-auto mb-4" />
            <h2 className="text-base font-semibold text-[#374151] mb-1">
              {subjects.length === 0 ? "No subjects yet" : "No results found"}
            </h2>
            <p className="text-sm text-[#6b7280]">
              {subjects.length === 0
                ? "No subjects have been added for the current semester."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map((subject) => (
              <Link
                to={`/subjects/${subject.id}`}
                key={subject.id}
                className="group bg-white rounded-xl border border-[#e5e7eb] hover:border-[#d1d5db] hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[#0a0a0a] rounded-xl">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <span className="px-2.5 py-1 bg-[#f3f4f6] text-[#374151] text-xs font-semibold rounded-full font-mono">
                      {subject.code}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-[#0a0a0a] group-hover:text-[#374151] transition-colors line-clamp-2 mb-2">
                    {subject.title}
                  </h2>

                  {subject.description && (
                    <p className="text-sm text-[#6b7280] line-clamp-2 mb-3">
                      {subject.description}
                    </p>
                  )}

                  <div className="border-t border-[#e5e7eb] pt-3 flex items-center justify-between">
                    {subject.semester && (
                      <div className="flex items-center text-xs text-[#6b7280]">
                        <div className="w-1.5 h-1.5 bg-[#9ca3af] rounded-full mr-2" />
                        {subject.semester.name}
                      </div>
                    )}
                    <div className="flex items-center text-[#6b7280] text-xs font-medium ml-auto group-hover:text-[#0a0a0a] transition-colors">
                      View <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectsPage;
