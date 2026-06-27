import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { File, Search, ChevronDown, Download, BookOpen, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";

type FileData = Database["public"]["Tables"]["files"]["Row"] & {
  subjects?: { title: string; code: string } | null;
};
type Subject = Database["public"]["Tables"]["subjects"]["Row"];

const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<number | "">("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [filesRes, subjectsRes] = await Promise.all([
          supabase.from("files")
            .select(`*, subjects:subject_id (title, code), semester:semesters!inner(id, name, is_current)`)
            .eq("is_active", true).eq("semester.is_current", true).order("created_at", { ascending: false }),
          supabase.from("subjects")
            .select("*, semester:semesters!inner(id, name, is_current)")
            .eq("is_active", true).eq("semester.is_current", true).order("title", { ascending: true }),
        ]);
        setFiles(filesRes.data || []);
        setSubjects(subjectsRes.data || []);
        document.title = "Files — ICTHub";
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.file_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.subjects?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.subjects?.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "" || file.file_type === selectedType;
    const matchesSubject = selectedSubject === "" || file.subject_id === selectedSubject;
    return matchesSearch && matchesType && matchesSubject;
  });

  const fileTypes = [...new Set(files.map((f) => f.file_type))].sort();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getTypeBadgeColor = (type: string) => {
    const map: Record<string, string> = {
      pdf: "bg-red-100 text-red-700",
      doc: "bg-blue-100 text-blue-700",
      docx: "bg-blue-100 text-blue-700",
      ppt: "bg-orange-100 text-orange-700",
      pptx: "bg-orange-100 text-orange-700",
      xls: "bg-green-100 text-green-700",
      xlsx: "bg-green-100 text-green-700",
    };
    return map[type.toLowerCase()] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Files</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Files &amp; Resources</h1>
          <p className="text-white/70 mt-1 text-sm">Download documents, slides and study materials</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent"
            />
          </div>
          <div className="relative w-full sm:w-52">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : "")}
              className="w-full pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary-700 cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-40">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary-700 cursor-pointer"
            >
              <option value="">All Types</option>
              {fileTypes.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {!loading && (
            <span className="text-sm text-gray-500 self-center whitespace-nowrap">
              {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-700 border-t-transparent" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
            <File className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              {files.length === 0 ? "No files yet" : "No results found"}
            </h2>
            <p className="text-sm text-gray-500">
              {files.length === 0 ? "No files have been uploaded for this semester." : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <a
                key={file.id}
                href={file.file_path}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-gray-200 hover:border-primary-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 group-hover:bg-primary-50 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                    <File className="h-5 w-5 text-gray-500 group-hover:text-primary-700 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-2 leading-tight">
                      {file.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={` font-bold px-1.5 py-0.5 rounded uppercase ${getTypeBadgeColor(file.file_type)}`}>
                      {file.file_type}
                    </span>
                    <span className=" text-gray-400">{formatFileSize(file.size)}</span>
                  </div>
                  <Download className="h-4 w-4 text-gray-300 group-hover:text-primary-700 transition-colors" />
                </div>
                {file.subjects && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1  text-gray-500">
                    <BookOpen className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="truncate">{file.subjects.code}</span>
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesPage;
