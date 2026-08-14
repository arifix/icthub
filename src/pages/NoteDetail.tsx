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
  MessageSquare,
  Reply,
  Send,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import { getStoredStudentName } from "../utils/portalStudent";

type Note = Database["public"]["Tables"]["notes"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Comment = Database["public"]["Tables"]["note_comments"]["Row"];

const formatCommentTime = (iso: string) => {
  const d = new Date(iso);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [authorName, setAuthorName] = useState(
    () => getStoredStudentName() ?? "",
  );
  const [newComment, setNewComment] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAuthorName(getStoredStudentName() ?? "");
  }, []);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("note_comments")
      .select("*")
      .eq("note_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setComments((data as Comment[]) ?? []));
  }, [id]);

  const submitComment = async (
    parentId: number | null,
    text: string,
    name: string,
  ) => {
    const trimText = text.trim();
    const trimName = name.trim();
    if (!trimText || !trimName || !id) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("note_comments")
      .insert({
        note_id: Number(id),
        parent_id: parentId,
        author_name: trimName,
        content: trimText,
      })
      .select()
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, data as Comment]);
      if (parentId === null) setNewComment("");
      else setReplyTexts((prev) => ({ ...prev, [parentId]: "" }));
      setReplyingTo(null);
    }
    setSubmitting(false);
  };

  const rootComments = comments.filter((c) => c.parent_id === null);
  const getReplies = (pid: number) =>
    comments.filter((c) => c.parent_id === pid);

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
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent" />
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
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
            <Link to="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/notes" className="hover:text-black transition-colors">
              Notes
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#6b7280] truncate max-w-xs">
              {note.title}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mb-4">
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
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-black uppercase tracking-widest mb-2">
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
          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-black prose-p:text-[#374151] prose-p:leading-7 prose-a:text-black prose-a:underline prose-code:bg-[#f3f4f6] prose-code:px-1 prose-code:rounded">
            <div dangerouslySetInnerHTML={{ __html: note.content }} />
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] mb-8">
          <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#374151]" />
            <span className="text-sm font-bold text-black">Comments</span>
            <span className="ml-auto text-xs bg-[#f3f4f6] text-[#6b7280] font-semibold px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          </div>

          {rootComments.length > 0 && (
            <div className="divide-y divide-[#e5e7eb]">
              {rootComments.map((comment) => {
                const replies = getReplies(comment.id);
                const isReplying = replyingTo === comment.id;
                return (
                  <div key={comment.id} className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#f3f4f6] rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#374151]">
                          {comment.author_name[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-black">
                            {comment.author_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatCommentTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        {!isReplying && replies.length === 0 && (
                          <button
                            onClick={() => setReplyingTo(comment.id)}
                            className="inline-flex items-center gap-1 mt-2 text-xs text-[#6b7280] hover:text-black transition-colors"
                          >
                            <Reply className="h-3 w-3" />
                            Reply
                          </button>
                        )}
                        {!isReplying && replies.length > 0 && (
                          <button
                            onClick={() => setReplyingTo(comment.id)}
                            className="inline-flex items-center gap-1 mt-2 text-xs text-[#6b7280] hover:text-black transition-colors"
                          >
                            <Reply className="h-3 w-3" />
                            Reply
                          </button>
                        )}
                      </div>
                    </div>

                    {replies.length > 0 && (
                      <div className="ml-11 mt-4 space-y-4">
                        {replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="flex items-start gap-3"
                          >
                            <div className="w-7 h-7 bg-[#f3f4f6] rounded-full flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-[#374151]">
                                {reply.author_name[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-black">
                                  {reply.author_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatCommentTime(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isReplying && (
                      <div className="ml-11 mt-4 space-y-2">
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Your name"
                            value={authorName}
                            readOnly
                            className="w-full pl-8 pr-3 py-2 text-sm border border-[#e5e7eb] rounded-lg bg-[#f9fafb] text-[#6b7280] focus:outline-none"
                          />
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Write a reply…"
                          value={replyTexts[comment.id] ?? ""}
                          onChange={(e) =>
                            setReplyTexts((prev) => ({
                              ...prev,
                              [comment.id]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            disabled={
                              submitting ||
                              !authorName.trim() ||
                              !(replyTexts[comment.id] ?? "").trim()
                            }
                            onClick={() =>
                              submitComment(
                                comment.id,
                                replyTexts[comment.id] ?? "",
                                authorName,
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition-opacity"
                          >
                            <Send className="h-3 w-3" />
                            Post reply
                          </button>
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="text-xs text-[#6b7280] hover:text-black transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-6 py-5 border-t border-[#e5e7eb]">
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              Add a comment
            </p>
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={authorName}
                  readOnly
                  className="w-full pl-8 pr-3 py-2 text-sm border border-[#e5e7eb] rounded-lg bg-[#f9fafb] text-[#6b7280] focus:outline-none"
                />
              </div>
              <textarea
                rows={3}
                placeholder="Share your thoughts…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
              <button
                disabled={
                  submitting || !authorName.trim() || !newComment.trim()
                }
                onClick={() => submitComment(null, newComment, authorName)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-opacity"
              >
                <Send className="h-3.5 w-3.5" />
                Post comment
              </button>
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <Link
          to="/notes"
          className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-black transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notes
        </Link>
      </div>
    </div>
  );
};

export default NoteDetailPage;
