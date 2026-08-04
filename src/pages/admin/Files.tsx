import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Edit,
  File,
  FileText,
  Plus,
  Search,
  Trash,
  Download,
  ChevronDown,
  Globe,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";

type FileData = Database["public"]["Tables"]["files"]["Row"] & {
  subjects?: { title: string; code: string } | null;
  semesters: { name: string };
};

type Semester = Database["public"]["Tables"]["semesters"]["Row"];

const AdminFiles: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    document.title = "Files — ICTHub Admin";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        { data: filesData, error: filesError },
        { data: semestersData, error: semestersError },
      ] = await Promise.all([
        supabase
          .from("files")
          .select(
            `
            *,
            subjects:subject_id (title, code),
            semesters:semester_id (name)
          `,
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("semesters")
          .select("*")
          .order("name", { ascending: true }),
      ]);

      if (filesError) throw filesError;
      if (semestersError) throw semestersError;

      setFiles(filesData || []);
      setSemesters(semestersData || []);

      // Set current semester as default
      const currentSemester = semestersData?.find((s) => s.is_current);
      if (currentSemester) {
        setSelectedSemester(currentSemester.id);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        setIsDeleting(true);

        // Get file path to delete from storage
        const { data: fileData } = await supabase
          .from("files")
          .select("file_path")
          .eq("id", id)
          .single();

        if (fileData) {
          // Delete from database
          const { error } = await supabase.from("files").delete().eq("id", id);

          if (error) throw error;

          setFiles(files.filter((file) => file.id !== id));
          toast.success("File deleted successfully");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        toast.error("Failed to delete file");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.file_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.subjects?.title &&
        file.subjects.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.subjects?.code &&
        file.subjects.code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === "" || file.file_type === selectedType;
    const matchesSemester =
      selectedSemester === "" || file.semester_id === selectedSemester;

    return matchesSearch && matchesType && matchesSemester;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  const getFileIcon = (_fileType: string) => {
    return <File className="h-6 w-6 text-white" />;
  };

  // Get unique file types
  const fileTypes = [
    "",
    ...Array.from(new Set(files.map((file) => file.file_type))),
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight">
              Files
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Upload, organize, and manage study materials
            </p>
          </div>
          <Link
            to="/admin/files/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] text-white rounded-lg text-sm font-medium hover:bg-[#374151] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Upload File
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] px-6 py-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] text-[#374151]"
              />
            </div>
            <div className="relative">
              <select
                value={selectedSemester}
                onChange={(e) =>
                  setSelectedSemester(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="pl-3 pr-8 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] bg-white appearance-none cursor-pointer text-[#374151]"
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="pl-3 pr-8 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] bg-white appearance-none cursor-pointer text-[#374151]"
              >
                <option value="">All Types</option>
                {fileTypes
                  .filter((t) => t !== "")
                  .map((type) => (
                    <option key={type} value={type}>
                      {type.toUpperCase()}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] pointer-events-none" />
            </div>
            {(searchTerm || selectedSemester !== "" || selectedType) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSemester("");
                  setSelectedType("");
                }}
                className="px-3 py-2 text-sm text-[#6b7280] hover:text-[#0a0a0a] border border-[#e5e7eb] rounded-xl hover:bg-[#f9fafb] transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a0a0a] border-t-transparent" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e5e7eb]">
            <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
              <File className="h-4 w-4 text-[#374151]" />
              <span className="text-sm font-bold text-[#0a0a0a]">Files</span>
              <span className="ml-auto text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
                {filteredFiles.length}{" "}
                {filteredFiles.length !== files.length && `/ ${files.length}`}
              </span>
            </div>
            {filteredFiles.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-[#f3f4f6] p-3 rounded-xl w-fit mx-auto mb-4">
                  <File className="h-8 w-8 text-[#9ca3af]" />
                </div>
                <p className="text-sm font-semibold text-[#374151]">
                  {files.length === 0
                    ? "No files yet"
                    : "No files match your filters"}
                </p>
                {files.length === 0 && (
                  <Link
                    to="/admin/files/new"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] text-white rounded-lg text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Upload File
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      {[
                        "Name",
                        "Type",
                        "Subject",
                        "Semester",
                        "Size",
                        "Date",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-[#f9fafb]">
                        <td className="px-5 py-3">
                          <p className="font-medium text-[#374151] truncate max-w-[200px]">
                            {file.name}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-semibold text-[#374151] bg-[#f3f4f6] px-2 py-0.5 rounded-full font-mono">
                            {file.file_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#6b7280]">
                          {file.subjects ? (
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3 shrink-0" />
                              {file.subjects.code}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[#9ca3af]">
                              <Globe className="h-3 w-3" />
                              General
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-[#6b7280]">
                          {file.semesters?.name || "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-[#9ca3af]">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-5 py-3 text-xs text-[#9ca3af] whitespace-nowrap">
                          {new Date(file.created_at).toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <a
                              href={file.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-[#374151] hover:text-[#0a0a0a] hover:bg-[#f3f4f6] rounded-lg"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                            <Link
                              to={`/admin/files/${file.id}`}
                              className="p-1.5 text-[#374151] hover:text-[#0a0a0a] hover:bg-[#f3f4f6] rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(file.id)}
                              disabled={isDeleting}
                              className="p-1.5 text-[#6b7280] hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFiles;
