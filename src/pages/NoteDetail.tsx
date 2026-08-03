import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Sparkles,
  ChevronRight,
  Clock,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";

type Note = Database["public"]["Tables"]["notes"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];

const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoteData = async () => {
      try {
        setLoading(true);

        if (!id) return;

        // Fetch note
        const { data: noteData, error: noteError } = await supabase
          .from("notes")
          .select("*")
          .eq("id", id)
          .single();

        if (noteError) throw noteError;
        setNote(noteData);

        if (noteData?.subject_id) {
          // Fetch related subject
          const { data: subjectData, error: subjectError } = await supabase
            .from("subjects")
            .select("*")
            .eq("id", noteData.subject_id)
            .single();

          if (subjectError) throw subjectError;
          setSubject(subjectData);

          document.title =
            noteData.title && subjectData.title
              ? `${noteData.title} - ${subjectData.title}`
              : "Note Detail";
        }
      } catch (error) {
        console.error("Error fetching note data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNoteData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0a0a0a] border-t-transparent" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center px-4">
        <FileText className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-700 mb-2">Note Not Found</h1>
        <p className="text-gray-500 text-sm mb-6">
          This note does not exist or has been removed.
        </p>
        <Link
          to="/notes"
          className="btn-primary inline-flex items-center gap-2 rounded"
        >
          Back to Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Page header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex items-center gap-2 text-[#9ca3af] text-xs mb-4">
            <Link to="/" className="hover:text-[#0a0a0a] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              to="/notes"
              className="hover:text-[#0a0a0a] transition-colors"
            >
              Notes
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#6b7280] truncate max-w-xs">
              {note.title}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight mb-4">
            {note.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            {subject && (
              <Link
                to={`/subjects/${subject.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#374151] bg-[#f3f4f6] px-3 py-1.5 rounded-full hover:bg-[#e5e7eb] transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" />
                {subject.code} — {subject.title}
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-[#6b7280]">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(note.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#6b7280]">
              <Clock className="h-3.5 w-3.5" />
              {Math.max(
                1,
                Math.ceil(
                  note.content.replace(/<[^>]+>/g, "").split(/\s+/).length /
                    200,
                ),
              )}{" "}
              min read
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* AI Summary */}
        {note.summary && (
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-6 flex items-start gap-4">
            <div className="w-9 h-9 bg-[#0a0a0a] rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0a0a0a] uppercase tracking-widest mb-2">
                AI Summary
              </p>
              <p className="text-sm text-[#374151] leading-relaxed">
                {note.summary}
              </p>
            </div>
          </div>
        )}

        {/* Note content */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 sm:p-10 mb-8">
          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-[#0a0a0a] prose-p:text-[#374151] prose-p:leading-7 prose-a:text-[#0a0a0a] prose-a:underline prose-code:bg-[#f3f4f6] prose-code:px-1 prose-code:rounded">
            <div dangerouslySetInnerHTML={{ __html: note.content }} />
          </div>
        </div>

        {/* Footer nav */}
        <Link
          to="/notes"
          className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#0a0a0a] transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notes
        </Link>
      </div>
    </div>
  );
};

export default NoteDetailPage;
