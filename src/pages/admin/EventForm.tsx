import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { createNotification } from "../../utils/notifications";

type Event = Database["public"]["Tables"]["events"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Semester = Database["public"]["Tables"]["semesters"]["Row"];

const AdminEventForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;

  // Parse query params to check for pre-filled date
  const queryParams = new URLSearchParams(location.search);
  const dateFromURL = queryParams.get("date");

  const [event, setEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    date: dateFromURL || new Date().toISOString().split("T")[0],
    subject_id: null,
    semester_id: null,
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetchData();
    if (isEditing) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      setEvent(
        data || {
          title: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          subject_id: null,
          semester_id: null,
        }
      );
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Failed to load event");
      navigate("/admin/calendar");
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

      // Set current semester as default for new events
      if (!isEditing) {
        const currentSemester = semestersData?.find((s) => s.is_current);
        if (currentSemester) {
          setEvent((prev) => ({ ...prev, semester_id: currentSemester.id }));
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "subject_id") {
      setEvent((prev) => ({ ...prev, [name]: value ? parseInt(value) : null }));
    } else if (name === "semester_id") {
      setEvent((prev) => ({ ...prev, [name]: value ? parseInt(value) : null }));
    } else {
      setEvent((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !event.title ||
      !event.description ||
      !event.date ||
      !event.semester_id
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);

      if (isEditing) {
        const { error } = await supabase
          .from("events")
          .update({
            title: event.title,
            description: event.description,
            date: event.date,
            subject_id: event.subject_id,
            semester_id: event.semester_id,
          })
          .eq("id", id!);

        if (error) throw error;
        toast.success("Event updated successfully");
      } else {
        const { data: newEvent, error } = await supabase
          .from("events")
          .insert([
          {
            title: event.title,
            description: event.description,
            date: event.date,
            subject_id: event.subject_id,
            semester_id: event.semester_id,
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
        toast.success("Event created successfully");

        // Create in-app notification for new event
        if (newEvent) {
          try {
            const eventDate = new Date(newEvent.date).toLocaleDateString('en-US', {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            await createNotification({
              type: "event",
              title: newEvent.title,
              message: `New event scheduled for ${eventDate}${
                newEvent.subjects ? ` in ${newEvent.subjects.title}` : ""
              }`,
              related_id: newEvent.id,
              semester_id: newEvent.semester_id,
              subject_id: newEvent.subject_id,
              created_by: "Admin",
            });
          } catch (notificationError) {
            console.error("Failed to create notification:", notificationError);
            // Don't show error to user as the main action succeeded
          }
        }
      }

      navigate("/admin/calendar");
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(`Failed to ${isEditing ? "update" : "create"} event`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isEditing ? "Edit Event" : "Add New Event"}
            </h1>
            <p className="text-amber-100">
              {isEditing
                ? "Update event details and information"
                : "Schedule a new academic event"}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/admin/calendar")}
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Calendar
            </button>
            <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
          <p className="text-sm text-gray-600 mt-1">
            Fill in the information below to {isEditing ? "update" : "create"}{" "}
            the event.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={event.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow duration-200"
                  placeholder="e.g., Midterm Exam"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={event.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow duration-200"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="semester_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  id="semester_id"
                  name="semester_id"
                  value={event.semester_id || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow duration-200"
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

              <div>
                <label
                  htmlFor="subject_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subject (Optional)
                </label>
                <select
                  id="subject_id"
                  name="subject_id"
                  value={event.subject_id || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow duration-200"
                >
                  <option value="">General Event (No Subject)</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code}: {subject.title}
                    </option>
                  ))}
                </select>
                <p className=" text-gray-500 mt-1">
                  Leave as "General Event" for university-wide events, holidays,
                  or other general announcements
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <ReactQuill
                  id="description"
                  name="description"
                  value={event.description}
                  onChange={(description) =>
                    setEvent((prev) => ({ ...prev, description }))
                  }
                  theme="snow"
                  className="h-48 lg:h-64"
                  placeholder="Enter event details..."
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["blockquote"],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-16 lg:mt-12 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/admin/calendar")}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || semesters.length === 0}
              className={`px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-200 flex items-center font-medium shadow-md hover:shadow-lg ${
                saving || semesters.length === 0
                  ? "opacity-70 cursor-not-allowed"
                  : ""
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  {isEditing ? "Update Event" : "Create Event"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEventForm;
