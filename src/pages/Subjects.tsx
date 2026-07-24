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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Current Semester Subjects
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse courses and study materials for this semester
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-5 border border-gray-100">
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-3.5 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                />
              </div>
              {!loading && (
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {filteredSubjects.length} subject
                  {filteredSubjects.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent" />
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              {subjects.length === 0 ? "No subjects yet" : "No results found"}
            </h2>
            <p className="text-sm text-gray-500">
              {subjects.length === 0
                ? "No subjects have been added for the current semester."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <Link
                to={`/subjects/${subject.id}`}
                key={subject.id}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full font-mono">
                      {subject.code}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                    {subject.title}
                  </h2>

                  {subject.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {subject.description}
                    </p>
                  )}

                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    {subject.semester && (
                      <div className="flex items-center text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                        {subject.semester.name}
                      </div>
                    )}
                    <div className="flex items-center text-blue-600 text-xs font-medium ml-auto">
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
