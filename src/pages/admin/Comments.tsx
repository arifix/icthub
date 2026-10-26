import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, MessageSquare, Search, ShieldCheck, Trash } from "lucide-react";
import { toast } from "react-hot-toast";
import { errorMessage, supabase } from "../../lib/supabase";
import { timeAgo } from "../../lib/format";
import { useAdminConfirm } from "../../components/AdminConfirm";
import { AdminPageHeader, AdminPanel } from "../../components/AdminUI";
import type { Tables } from "../../types/supabase";

type Comment = Tables<"note_comments"> & {
  notes: { id: number; title: string; subjects: { code: string } | null } | null;
};

const PAGE_SIZE = 100;

const AdminComments: React.FC = () => {
  const confirm = useAdminConfirm();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("note_comments")
      .select("*, notes:note_id (id, title, subjects:subject_id (code))")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (error) toast.error("Failed to load comments");
    else setComments((data ?? []) as Comment[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = "Comments — ICTHub Admin";
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return comments;
    return comments.filter((c) =>
      [c.content, c.author_name, c.notes?.title, c.notes?.subjects?.code].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [comments, query]);

  const remove = async (comment: Comment) => {
    const ok = await confirm({
      title: "Delete comment?",
      message: `This removes the comment by ${comment.author_name}${comment.parent_id ? "" : " and any replies to it"}. This can't be undone.`,
      confirmLabel: "Delete comment",
    });
    if (!ok) return;
    const { error } = await supabase.from("note_comments").delete().eq("id", comment.id);
    if (error) {
      toast.error(errorMessage(error, "Failed to delete comment"));
      return;
    }
    setComments((list) => list.filter((c) => c.id !== comment.id && c.parent_id !== comment.id));
    toast.success("Comment deleted");
  };

  const sendReply = async (comment: Comment) => {
    if (!reply.trim()) return;
    setSending(true);
    const { error } = await supabase.from("note_comments").insert({
      note_id: comment.note_id,
      parent_id: comment.parent_id ?? comment.id,
      content: reply.trim(),
    });
    setSending(false);
    if (error) {
      toast.error(errorMessage(error, "Failed to post reply"));
      return;
    }
    toast.success("Reply posted");
    setReply("");
    setReplyTo(null);
    void load();
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <AdminPageHeader title="Comments" description="Review and moderate student discussion on notes" />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search comments, authors or notes…"
            aria-label="Search comments"
            className="w-full pl-9 pr-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm bg-white"
          />
        </div>

        <AdminPanel title="Recent comments" icon={MessageSquare} count={filtered.length}>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-slate-500">
              {comments.length ? "No comments match your search." : "No comments yet."}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((comment) => (
                <li key={comment.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        comment.author_role === "admin" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {comment.author_role === "admin" ? <ShieldCheck className="h-4 w-4" /> : comment.author_name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span className="font-semibold text-slate-900">{comment.author_name}</span>
                        {comment.parent_id && <span className="text-xs text-slate-400">replied</span>}
                        <span className="text-xs text-slate-400" title={new Date(comment.created_at).toLocaleString()}>
                          {timeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{comment.content}</p>
                      {comment.notes && (
                        <Link
                          to={`/notes/${comment.notes.id}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                        >
                          {comment.notes.subjects?.code ? `${comment.notes.subjects.code} · ` : ""}
                          {comment.notes.title}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}

                      {replyTo === comment.id && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            rows={2}
                            autoFocus
                            maxLength={2000}
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Reply as ICTHub Admin…"
                            aria-label="Reply"
                            className="w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={sending || !reply.trim()}
                              onClick={() => void sendReply(comment)}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {sending ? "Posting…" : "Post reply"}
                            </button>
                            <button type="button" onClick={() => setReplyTo(null)} className="px-3 py-1.5 text-xs text-slate-500">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {replyTo !== comment.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTo(comment.id);
                            setReply("");
                          }}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Reply
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void remove(comment)}
                        aria-label={`Delete comment by ${comment.author_name}`}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
        {comments.length === PAGE_SIZE && (
          <p className="text-xs text-slate-500">Showing the {PAGE_SIZE} most recent comments.</p>
        )}
      </div>
    </div>
  );
};

export default AdminComments;
