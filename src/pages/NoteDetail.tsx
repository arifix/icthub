import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, FileText, Sparkles, ChevronRight } from "lucide-react";
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
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Page header */}
      <div className="border-b border-gray-200/80 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/notes" className="hover:text-blue-600 transition-colors">
              Notes
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-600 truncate">{note.title}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {note.title}
          </h1>
          {subject && (
            <Link
              to={`/subjects/${subject.id}`}
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {subject.title} ({subject.code})
            </Link>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* AI Summary */}
        {note.summary && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                Summary
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {note.summary}
              </p>
            </div>
          </div>
        )}

        {/* Note content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
          <div className="prose prose-gray max-w-none">
            <div dangerouslySetInnerHTML={{ __html: note.content }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailPage;
