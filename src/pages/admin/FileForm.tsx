import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, File, Save, Upload, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";

type FileData = Database["public"]["Tables"]["files"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Semester = Database["public"]["Tables"]["semesters"]["Row"];

const AdminFileForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [file, setFile] = useState<Partial<FileData>>({
    name: "",
    subject_id: null,
    file_path: "",
    file_type: "",
    size: 0,
    semester_id: null,
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetchData();
    if (isEditing) {
      fetchFile();
    }
  }, [id]);

  const fetchFile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      setFile(
        data || {
          name: "",
          subject_id: null,
          file_path: "",
          file_type: "",
          size: 0,
          semester_id: null,
        },
      );
    } catch (error) {
      console.error("Error fetching file:", error);
      toast.error("Failed to load file");
      navigate("/admin/files");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoadingData(true);

      const [
        { data: allSubjects, error: subjectsError },
        { data: semestersData, error: semestersError },
      ] = await Promise.all([
        supabase
          .from("subjects")
          .select(
            `
            *,
            semester:semesters(id, name, is_current)
          `,
          )
          .eq("is_active", true)
          .order("title", { ascending: true }),
        supabase
          .from("semesters")
          .select("*")
          .order("start_date", { ascending: false }),
      ]);

      if (subjectsError) throw subjectsError;
      if (semestersError) throw semestersError;

      // Filter for current semester subjects only
      const currentSemesterSubjects =
        allSubjects?.filter(
          (subject: any) => subject.semester?.is_current === true,
        ) || [];

      setSubjects(currentSemesterSubjects);
      setSemesters(semestersData || []);

      // Set current semester as default for new files
      if (!isEditing) {
        const currentSemester = semestersData?.find((s) => s.is_current);
        if (currentSemester) {
          setFile((prev) => ({ ...prev, semester_id: currentSemester.id }));
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load form data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "subject_id") {
      setFile((prev) => ({
        ...prev,
        [name]: value ? parseInt(value) : null,
      }));
    } else if (name === "semester_id") {
      setFile((prev) => ({
        ...prev,
        [name]: value ? parseInt(value) : null,
      }));
    } else {
      setFile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFileObject = e.target.files[0];
      setSelectedFile(selectedFileObject);

      // Extract file extension
      const fileExt =
        selectedFileObject.name.split(".").pop()?.toLowerCase() || "";

      setFile((prev) => ({
        ...prev,
        name: prev.name || selectedFileObject.name,
        size: selectedFileObject.size,
        file_type: fileExt,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file.name || !file.semester_id) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!isEditing && !selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setSaving(true);
      let filePath = file.file_path;

      if (selectedFile) {
        const { data, error } = await supabase.storage
          .from("icthub-files")
          .upload(`${Date.now()}_${selectedFile.name}`, selectedFile);
        if (error) throw error;
        filePath =
          "https://fxercuesfbcpizrggehw.supabase.co/storage/v1/object/public/icthub-files/" +
          data.path;
      }

      if (isEditing) {
        const { error } = await supabase
          .from("files")
          .update({
            name: file.name,
            subject_id: file.subject_id,
            semester_id: file.semester_id,
            file_path: filePath,
            file_type: file.file_type,
            size: file.size,
          })
          .eq("id", id!);

        if (error) throw error;
        toast.success("File updated successfully");
      } else {
        const { data: newFile, error } = await supabase
          .from("files")
          .insert([
            {
              name: file.name,
              subject_id: file.subject_id,
              semester_id: file.semester_id,
              file_path: filePath,
              file_type: file.file_type,
              size: file.size,
            },
          ])
          .select(
            `
          *,
          subjects:subject_id (title, code),
          semesters:semester_id (name)
        `,
          )
          .single();

        if (error) throw error;
        toast.success("File uploaded successfully");
      }

      navigate("/admin/files");
    } catch (error) {
      console.error("Error saving file:", error);
      toast.error(`Failed to ${isEditing ? "update" : "upload"} file`);
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a0a0a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight">
              {isEditing ? "Edit File" : "Upload File"}
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              {isEditing
                ? "Update file information"
                : "Add a new file resource for students"}
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/files")}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Files
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-[#e5e7eb]">
          <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
            <File className="h-4 w-4 text-[#374151]" />
            <span className="text-sm font-bold text-[#0a0a0a]">
              File Details
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  File Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={file.name}
                  onChange={handleChange}
                  placeholder="e.g., Lecture Notes Week 1"
                  required
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] text-[#374151]"
                />
              </div>
              <div>
                <label
                  htmlFor="semester_id"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  Semester <span className="text-red-400">*</span>
                </label>
                <select
                  id="semester_id"
                  name="semester_id"
                  value={file.semester_id || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] bg-white text-[#374151]"
                >
                  <option value="">Select a semester</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="subject_id"
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
              >
                Subject (Optional)
              </label>
              <select
                id="subject_id"
                name="subject_id"
                value={file.subject_id || ""}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] bg-white text-[#374151]"
              >
                <option value="">General File (No Subject)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code}: {s.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#9ca3af] mt-1.5">
                Leave blank for notices, routines, or other general documents
              </p>
            </div>

            {(file.file_type || (file.size ?? 0) > 0) && (
              <div className="flex items-center gap-4 p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb] text-sm">
                <span className="text-xs font-semibold text-[#374151] bg-[#f3f4f6] px-2 py-0.5 rounded-full font-mono">
                  {file.file_type?.toUpperCase() || "?"}
                </span>
                <span className="text-[#6b7280]">
                  {formatFileSize(file.size ?? 0)}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5">
                {isEditing ? (
                  "Replace File (Optional)"
                ) : (
                  <>
                    Select File <span className="text-red-400">*</span>
                  </>
                )}
              </label>
              <div className="border-2 border-dashed border-[#e5e7eb] rounded-xl p-8 text-center hover:border-[#d1d5db] transition-colors">
                <Upload className="mx-auto h-10 w-10 text-[#d1d5db] mb-3" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-[#374151] hover:text-[#0a0a0a]">
                    Click to upload
                  </span>
                  <span className="text-sm text-[#9ca3af]">
                    {" "}
                    or drag and drop
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-xs text-[#9ca3af] mt-1">
                  PDF, DOC, PPT, TXT, JPG, PNG up to 10MB
                </p>
                {selectedFile && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs bg-[#f0fdf4] text-[#16a34a] px-3 py-1.5 rounded-full font-medium">
                    <File className="h-3.5 w-3.5" />
                    {selectedFile.name}
                  </div>
                )}
              </div>
            </div>

            {!isEditing && !selectedFile && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">File required</span> — please
                  select a file before submitting.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/admin/files")}
                className="px-4 py-2.5 text-sm font-medium text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  saving ||
                  semesters.length === 0 ||
                  (!isEditing && !selectedFile)
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#0a0a0a] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    {isEditing ? "Updating…" : "Uploading…"}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? "Update File" : "Upload File"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminFileForm;
