import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search, ChevronRight, User } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";

type Subject = Database["public"]["Tables"]["subjects"]["Row"] & {
  semester?: { name: string } | null;
  teachers?: Array<{ name: string; designation?: string }>;
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
          .select(
            `*, semester:semesters(id, name, is_current), subject_teachers(teachers:teacher_id(name, designation))`
          )
          .eq("is_active", true)
          .order("title", { ascending: true });

        if (error) throw error;

        const subjectsWithTeachers =
          data
            ?.filter((subject: any) => subject.semester?.is_current === true)
            .map((subject: any) => ({
              ...subject,
              teachers:
                subject.subject_teachers?.map((st: any) => st.teachers).filter(Boolean) || [],
            })) || [];

        setSubjects(subjectsWithTeachers);
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
      subject.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.teachers?.some((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Subjects</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Current Semester Subjects</h1>
          <p className="text-white/70 mt-1 text-sm">Browse courses and study materials for this semester</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search */}
        <div className="mb-8 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent"
            />
          </div>
          {!loading && (
            <span className="text-sm text-gray-500">
              {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-700 border-t-transparent" />
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map((subject) => (
              <Link
                to={`/subjects/${subject.id}`}
                key={subject.id}
                className="group bg-white border border-gray-200 hover:border-primary-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Card top accent */}
                <div className="h-1 bg-primary-700" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-700 rounded-lg flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <span className=" font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded">
                      {subject.code}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-2 mb-3">
                    {subject.title}
                  </h2>

                  {subject.description && (
                    <p className=" text-gray-500 line-clamp-2 mb-3">
                      {subject.description}
                    </p>
                  )}

                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <div className="space-y-1">
                      {subject.semester && (
                        <p className=" text-gray-500">{subject.semester.name}</p>
                      )}
                      {subject.teachers && subject.teachers.length > 0 && (
                        <p className=" text-gray-600 flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          {subject.teachers[0].name}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-primary-700 group-hover:translate-x-0.5 transition-transform" />
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

