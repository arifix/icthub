import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  useEffect(() => {
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
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Manage Files</h1>
            <p className="text-purple-100">
              Upload, organize, and manage study materials and resources
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/files/new"
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload File
            </Link>
            <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="search"
              className="block font-semibold text-gray-700 mb-2"
            >
              Search Files
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search by name, type, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="semester"
              className="block font-semibold text-gray-700 mb-2"
            >
              Filter by Semester
            </label>
            <div className="relative">
              <select
                id="semester"
                value={selectedSemester}
                onChange={(e) =>
                  setSelectedSemester(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white appearance-none cursor-pointer"
              >
                <option value="">All Semesters</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="fileType"
              className="block font-semibold text-gray-700 mb-2"
            >
              Filter by Type
            </label>
            <div className="relative">
              <select
                id="fileType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white appearance-none cursor-pointer"
              >
                <option value="">All Types</option>
                {fileTypes
                  .filter((type) => type !== "")
                  .map((type) => (
                    <option key={type} value={type}>
                      {type.toUpperCase()}
                    </option>
                  ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedType("");
                setSelectedSemester("");
              }}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-semibold"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <File className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Files Found
          </h3>
          <p className="text-gray-600 mb-6">
            {files.length === 0
              ? "Start by uploading your first file to share study materials."
              : "No files match your search criteria. Try adjusting your filters."}
          </p>
          {files.length === 0 && (
            <Link
              to="/admin/files/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload File
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-200">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full  font-medium bg-purple-100 text-purple-800">
                      {file.file_type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-200 line-clamp-2">
                    {file.name}
                  </h3>

                  <div className="space-y-2 mb-3">
                    {file.subjects ? (
                      <div className="flex items-center text-sm text-gray-500">
                        <BookOpen className="h-4 w-4 mr-1" />
                        <span>
                          {file.subjects.title} ({file.subjects.code})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-gray-500">
                        <Globe className="h-4 w-4 mr-1" />
                        <span>General File</span>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Semester:</span>
                      <span className="ml-1">{file.semesters?.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <a
                    href={file.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                  <div className="flex space-x-2">
                    <Link
                      to={`/admin/files/${file.id}`}
                      className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={isDeleting}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFiles;
