import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, File, Save, Upload, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";
import { createNotification } from "../../utils/notifications";

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
        }
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
          .select(`
            *,
            semester:semesters(id, name, is_current)
          `)
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
      const currentSemesterSubjects = allSubjects?.filter(
        (subject: any) => subject.semester?.is_current === true
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
          .from("files")
          .upload(`${Date.now()}_${selectedFile.name}`, selectedFile);
        if (error) throw error;
        filePath =
          "https://fxercuesfbcpizrggehw.supabase.co/storage/v1/object/public/files/" +
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
        `
          )
          .single();

        if (error) throw error;
        toast.success("File uploaded successfully");

        // Create in-app notification for new file
        if (newFile) {
          try {
            await createNotification({
              type: "file",
              title: newFile.name,
              message: `New ${newFile.file_type.toUpperCase()} file uploaded`,
              related_id: newFile.id,
              semester_id: newFile.semester_id,
              subject_id: newFile.subject_id,
              created_by: "Admin",
            });
          } catch (notificationError) {
            console.error("Failed to create notification:", notificationError);
            // Don't show error to user as the main action succeeded
          }
        }
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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isEditing ? "Edit File" : "Upload New File"}
            </h1>
            <p className="text-purple-100">
              {isEditing
                ? "Update file information and settings"
                : "Add a new file resource for students"}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/admin/files")}
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Files
            </button>
            <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
              <File className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">File Details</h2>
          <p className="text-sm text-gray-600 mt-1">
            Fill in the information below to {isEditing ? "update" : "upload"}{" "}
            the file.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  File Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={file.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow duration-200"
                  placeholder="e.g., Lecture Notes Week 1"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="semester_id"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  id="semester_id"
                  name="semester_id"
                  value={file.semester_id || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow duration-200"
                  required
                >
                  <option value="">Select a semester</option>
                  {semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="subject_id"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Subject (Optional)
              </label>
              <select
                id="subject_id"
                name="subject_id"
                value={file.subject_id || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow duration-200"
              >
                <option value="">General File (No Subject)</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code}: {subject.title}
                  </option>
                ))}
              </select>
              <p className=" text-gray-500 mt-1">
                Leave as "General File" for notices, routines, or other general
                documents
              </p>
            </div>

            {(file.file_type || file.size > 0) && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  File Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium text-purple-700">
                      {file.file_type.toUpperCase() || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <span className="ml-2 font-medium text-purple-700">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEditing ? "Replace File (Optional)" : "Select File"}{" "}
                {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-400 transition-colors duration-200">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className=" text-gray-500">
                    PDF, DOC, PPT, TXT, JPG, PNG up to 10MB
                  </p>
                  {selectedFile && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-medium flex items-center">
                        <File className="h-4 w-4 mr-2" />
                        Selected: {selectedFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isEditing && !selectedFile && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">File Required</p>
                    <p>
                      Please select a file to upload before submitting the form.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/admin/files")}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-semibold"
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
              className={`px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center font-semibold ${
                saving ||
                semesters.length === 0 ||
                (!isEditing && !selectedFile)
                  ? "opacity-70 cursor-not-allowed"
                  : ""
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  {isEditing ? "Updating..." : "Uploading..."}
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  {isEditing ? "Update File" : "Upload File"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFileForm;
