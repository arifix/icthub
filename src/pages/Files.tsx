import React, { useEffect, useState } from "react";
import {
  File,
  Search,
  ChevronDown,
  Download,
  ExternalLink,
  BookOpen,
  Globe,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import { trackUserActivity } from "../hooks/usePageTracking";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

type FileData = Database["public"]["Tables"]["files"]["Row"] & {
  subjects?: { title: string; code: string } | null;
};
type Subject = Database["public"]["Tables"]["subjects"]["Row"];

const FilesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<number | "">("");
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [filesRes, subjectsRes] = await Promise.all([
          supabase
            .from("files")
            .select(
              `*, subjects:subject_id (title, code), semester:semesters!inner(id, name, is_current)`,
            )
            .eq("is_active", true)
            .eq("semester.is_current", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("subjects")
            .select("*, semester:semesters!inner(id, name, is_current)")
            .eq("is_active", true)
            .eq("semester.is_current", true)
            .order("title", { ascending: true }),
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
    const matchesSubject =
      selectedSubject === "" || file.subject_id === selectedSubject;
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
      doc: "bg-[#e6f2ff] text-[#0052cc]",
      docx: "bg-[#e6f2ff] text-[#0052cc]",
      ppt: "bg-orange-100 text-orange-700",
      pptx: "bg-orange-100 text-orange-700",
      xls: "bg-green-100 text-green-700",
      xlsx: "bg-green-100 text-green-700",
    };
    return map[type.toLowerCase()] || "bg-gray-100 text-gray-700";
  };

  const downloadFile = async (file: FileData) => {
    setDownloadingFileId(file.id);
    try {
      const fileUrl = new URL(file.file_path, window.location.origin);
      const storageMarker = "/object/public/icthub-files/";
      const markerIndex = fileUrl.pathname.indexOf(storageMarker);
      let fileBlob: Blob;

      if (markerIndex >= 0) {
        const storagePath = decodeURIComponent(
          fileUrl.pathname.slice(markerIndex + storageMarker.length),
        );
        const { data, error } = await supabase.storage
          .from("icthub-files")
          .download(storagePath);
        if (error) throw error;
        fileBlob = data;
      } else {
        const response = await fetch(file.file_path);
        if (!response.ok) throw new Error("Unable to download file");
        fileBlob = await response.blob();
      }

      const objectUrl = URL.createObjectURL(fileBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = file.name;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Unable to download this file. Please try again.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Page header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mb-1">
            Files &amp; Resources
          </h1>
          <p className="text-sm text-[#6b7280]">
            Download documents, slides and study materials
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="w-full px-5 py-3 pl-11 border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all bg-white text-sm"
              />
            </div>
            <div className="relative w-full sm:w-52">
              <select
                value={selectedSubject}
                onChange={(e) => {
                  const nextValue = e.target.value
                    ? Number(e.target.value)
                    : "";
                  setSelectedSubject(nextValue);
                }}
                className="w-full pl-4 pr-8 py-3 border border-[#e5e7eb] rounded-xl text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
            <div className="relative w-full sm:w-40">
              <select
                value={selectedType}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSelectedType(nextValue);
                }}
                className="w-full pl-4 pr-8 py-3 border border-[#e5e7eb] rounded-xl text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
              >
                <option value="">All Types</option>
                {fileTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-16 text-center">
            <File className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-base font-semibold text-[#374151] mb-1">
              {files.length === 0 ? "No files yet" : "No results found"}
            </h2>
            <p className="text-sm text-[#6b7280]">
              {files.length === 0
                ? "No files have been uploaded for this semester."
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group bg-white rounded-xl border border-[#e5e7eb] hover:border-[#d1d5db] hover:shadow-md transition-all duration-200 p-4"
              >
                <a
                  href={file.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    !isAdmin
                      ? void trackUserActivity({
                          eventType: "file_open",
                          page: "/files",
                          label: file.name,
                          entityType: "file",
                          entityId: file.id,
                          metadata: {
                            fileType: file.file_type,
                            subjectId: file.subject_id,
                            subjectCode: file.subjects?.code ?? null,
                          },
                        })
                      : undefined
                  }
                  className="block"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#f3f4f6] group-hover:bg-[#e5e7eb] rounded-xl flex items-center justify-center shrink-0 transition-colors">
                      <File className="h-5 w-5 text-[#374151]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-black group-hover:text-[#374151] transition-colors line-clamp-2 leading-tight">
                        {file.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase ${getTypeBadgeColor(file.file_type)}`}
                      >
                        {file.file_type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>
                  {file.subjects ? (
                    <div className="mt-4 pt-2 border-t border-[#e5e7eb] flex items-center gap-2 text-sm text-[#6b7280]">
                      <BookOpen className="h-3 w-3 text-gray-500 shrink-0" />
                      <span className="truncate">
                        {file.subjects.title} ({file.subjects.code})
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 pt-2 border-t border-[#e5e7eb] flex items-center gap-2 text-sm text-[#6b7280]">
                      <Globe className="h-3 w-3 text-gray-500 shrink-0" />
                      <span className="truncate">General File</span>
                    </div>
                  )}
                </a>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href={file.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      !isAdmin
                        ? void trackUserActivity({
                            eventType: "file_open",
                            page: "/files",
                            label: file.name,
                            entityType: "file",
                            entityId: file.id,
                            metadata: {
                              fileType: file.file_type,
                              subjectId: file.subject_id,
                              subjectCode: file.subjects?.code ?? null,
                            },
                          })
                        : undefined
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#e5e7eb] px-2 py-2 text-sm font-medium text-[#374151] hover:border-[#0066ff] hover:text-[#0066ff] focus:outline-none focus:ring-2 focus:ring-[#0066ff]"
                    aria-label={`Preview ${file.name}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Preview
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAdmin) {
                        void trackUserActivity({
                          eventType: "file_download",
                          page: "/files",
                          label: file.name,
                          entityType: "file",
                          entityId: file.id,
                          metadata: {
                            fileType: file.file_type,
                            subjectId: file.subject_id,
                            subjectCode: file.subjects?.code ?? null,
                          },
                        });
                      }
                      void downloadFile(file);
                    }}
                    disabled={downloadingFileId === file.id}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0066ff] px-2 py-2 text-sm font-medium text-white hover:bg-[#0052cc] disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#0066ff]"
                    aria-label={`Download ${file.name}`}
                  >
                    <Download className="h-4 w-4" />
                    {downloadingFileId === file.id
                      ? "Downloading..."
                      : "Download"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesPage;
