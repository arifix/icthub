import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

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
        },
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
    >,
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

    if (!event.title || !event.date || !event.semester_id) {
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
        `,
          )
          .single();

        if (error) throw error;
        toast.success("Event created successfully");
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              {isEditing ? "Edit Event" : "New Event"}
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              {isEditing
                ? "Update event details"
                : "Schedule a new academic event"}
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/calendar")}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Calendar
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-[#e5e7eb]">
          <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#374151]" />
            <span className="text-sm font-bold text-black">Event Details</span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  Event Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={event.title}
                  onChange={handleChange}
                  placeholder="e.g., Midterm Exam"
                  required
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
                />
              </div>
              <div>
                <label
                  htmlFor="date"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={event.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-[#374151]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  value={event.semester_id || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white text-[#374151]"
                >
                  <option value="">Select a semester</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
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
                  value={event.subject_id || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white text-[#374151]"
                >
                  <option value="">General Event (No Subject)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
              >
                Description
              </label>
              <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
                <ReactQuill
                  value={event.description}
                  onChange={(description) =>
                    setEvent((prev) => ({ ...prev, description }))
                  }
                  theme="snow"
                  className="h-48 lg:h-64"
                  placeholder="Enter event details…"
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

            <div className="flex justify-end gap-3 pt-14 lg:pt-10">
              <button
                type="button"
                onClick={() => navigate("/admin/calendar")}
                className="px-4 py-2.5 text-sm font-medium text-[#374151] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || semesters.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-black text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? "Update Event" : "Create Event"}
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

export default AdminEventForm;
