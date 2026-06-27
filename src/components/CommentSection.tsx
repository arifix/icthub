import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Reply,
  Edit,
  Trash,
  User,
  UserCheck,
  Shield,
  Clock,
  MoreVertical,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

type Comment = Database["public"]["Tables"]["note_comments"]["Row"] & {
  replies?: Comment[];
};

interface CommentSectionProps {
  noteId: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ noteId }) => {
  const { isAdmin, user } = useAuth();
  const { student, isAuthenticated: isStudentAuthenticated } = useStudentAuth();
  const { teacher, isAuthenticated: isTeacher } = useTeacherAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);

  const isAuthenticated = isAdmin || isStudentAuthenticated || isTeacher;

  useEffect(() => {
    fetchComments();
  }, [noteId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("note_comments")
        .select("*")
        .eq("note_id", noteId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Organize comments into threads
      const commentMap = new Map<number, Comment>();
      const rootComments: Comment[] = [];

      // First pass: create all comments
      data?.forEach((comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: organize into threads
      data?.forEach((comment) => {
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies!.push(commentMap.get(comment.id)!);
          }
        } else {
          rootComments.push(commentMap.get(comment.id)!);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = () => {
    if (isAdmin && user) {
      return {
        id: user.email || "admin",
        type: "admin" as const,
        name: "Administrator",
      };
    }
    if (isTeacher && teacher) {
      return {
        id: teacher.email,
        type: "teacher" as const,
        name: teacher.name,
      };
    }
    if (isStudentAuthenticated && student) {
      return {
        id: student.id_no,
        type: "student" as const,
        name: student.name,
      };
    }
    return null;
  };

  const canEditComment = (comment: Comment) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    // Admin can edit any comment
    if (currentUser.type === "admin") return true;

    // Users can edit their own comments
    return (
      comment.user_id === currentUser.id &&
      comment.user_type === currentUser.type
    );
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from("note_comments").insert({
        note_id: noteId,
        user_id: currentUser.id,
        user_type: currentUser.type,
        user_name: currentUser.name,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      await fetchComments();
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim() || !isAuthenticated) return;

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from("note_comments").insert({
        note_id: noteId,
        user_id: currentUser.id,
        user_type: currentUser.type,
        user_name: currentUser.name,
        content: replyContent.trim(),
        parent_id: parentId,
      });

      if (error) throw error;

      setReplyContent("");
      setReplyTo(null);
      await fetchComments();
      toast.success("Reply added successfully");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("note_comments")
        .update({ content: editContent.trim() })
        .eq("id", commentId);

      if (error) throw error;

      setEditContent("");
      setEditingComment(null);
      await fetchComments();
      toast.success("Comment updated successfully");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      const { error } = await supabase
        .from("note_comments")
        .update({ is_active: false })
        .eq("id", commentId);

      if (error) throw error;

      await fetchComments();
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const getUserIcon = (userType: string) => {
    switch (userType) {
      case "admin":
        return <Shield className="h-4 w-4 text-green-700" />;
      case "teacher":
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case "student":
        return <User className="h-4 w-4 text-purple-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-12 mt-4" : "mb-6"}`}>
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-gray-200 p-5 hover:border-indigo-300 hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                  comment.user_type === "admin"
                    ? "bg-gradient-to-br from-blue-100 to-indigo-200"
                    : comment.user_type === "teacher"
                    ? "bg-gradient-to-br from-emerald-100 to-green-200"
                    : "bg-gradient-to-br from-purple-100 to-fuchsia-200"
                }`}
              >
                {getUserIcon(comment.user_type)}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900 text-lg">
                  {comment.user_name}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg  font-bold ${
                    comment.user_type === "admin"
                      ? "bg-gradient-to-r green-100 text-green-800"
                      : comment.user_type === "teacher"
                      ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800"
                      : "bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-800"
                  }`}
                >
                  {comment.user_type}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 font-medium mt-1">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                {formatTimeAgo(comment.created_at)}
                {comment.updated_at !== comment.created_at && (
                  <span className="ml-2  text-indigo-600 font-semibold">
                    (edited)
                  </span>
                )}
              </div>
            </div>
          </div>

          {canEditComment(comment) && (
            <div className="relative">
              <button
                onClick={() =>
                  setShowDropdown(
                    showDropdown === comment.id ? null : comment.id
                  )
                }
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {showDropdown === comment.id && (
                <div className="absolute right-0 mt-1 w-36 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border-2 border-gray-200 z-10 overflow-hidden">
                  <button
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditContent(comment.content);
                      setShowDropdown(null);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 flex items-center font-semibold transition-all duration-200"
                  >
                    <Edit className="h-4 w-4 mr-2 text-indigo-600" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteComment(comment.id);
                      setShowDropdown(null);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center font-semibold transition-all duration-200"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {editingComment === comment.id ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-medium"
              rows={3}
              placeholder="Edit your comment..."
            />
            <div className="flex space-x-2">
              <button
                onClick={() => handleEditComment(comment.id)}
                disabled={submitting || !editContent.trim()}
                className="px-4 py-2 bg-gradient-to-r bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 disabled:opacity-50 transition-all duration-200 shadow-lg"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditingComment(null);
                  setEditContent("");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-800 mb-4 whitespace-pre-wrap font-medium leading-relaxed">
              {comment.content}
            </p>

            {isAuthenticated && !isReply && (
              <button
                onClick={() =>
                  setReplyTo(replyTo === comment.id ? null : comment.id)
                }
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-bold transition-all duration-200"
              >
                <Reply className="h-4 w-4 mr-1.5" />
                Reply
              </button>
            )}
          </>
        )}

        {replyTo === comment.id && (
          <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-medium bg-white"
              rows={3}
              placeholder="Write a reply..."
            />
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={submitting || !replyContent.trim()}
                className="px-4 py-2 bg-gradient-to-r bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 disabled:opacity-50 flex items-center transition-all duration-200 shadow-lg"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post Reply
              </button>
              <button
                onClick={() => {
                  setReplyTo(null);
                  setReplyContent("");
                }}
                className="px-4 py-2 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 border-2 border-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-8 bg-gradient-to-br gray-50 rounded-2xl p-8 border-2 border-gray-200 shadow-lg">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-gradient-to-br green-100 rounded-xl flex items-center justify-center mr-4 shadow-md">
          <MessageCircle className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Discussion</h3>
          <p className="text-sm text-gray-600 font-semibold">
            {comments.length +
              comments.reduce(
                (acc, c) => acc + (c.replies?.length || 0),
                0
              )}{" "}
            comment
            {comments.length +
              comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0) !==
            1
              ? "s"
              : ""}
          </p>
        </div>
      </div>

      {/* Add new comment form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-medium"
              rows={4}
              placeholder="Share your thoughts about this note..."
              required
            />
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
              <div className="text-sm text-gray-600 font-semibold">
                Commenting as{" "}
                <span className="font-bold text-gray-900">
                  {getCurrentUser()?.name}
                </span>
                <span
                  className={`ml-2 inline-flex items-center px-2.5 py-1 rounded-lg  font-bold ${
                    getCurrentUser()?.type === "admin"
                      ? "bg-gradient-to-r green-100 text-green-800"
                      : getCurrentUser()?.type === "teacher"
                      ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800"
                      : "bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-800"
                  }`}
                >
                  {getCurrentUser()?.type}
                </span>
              </div>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-6 py-3 bg-gradient-to-r bg-green-700 text-white rounded-xl hover:bg-green-800 disabled:opacity-50 flex items-center font-bold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                ) : (
                  <Send className="h-5 w-5 mr-2" />
                )}
                Post Comment
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-gray-200 p-8 text-center mb-8 shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <MessageCircle className="h-8 w-8 text-indigo-600" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">
            Join the Discussion
          </h4>
          <p className="text-gray-600 mb-6 font-medium">
            Please log in to share your thoughts and engage with others
          </p>
          <a
            href="/student-login"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r bg-green-700 text-white rounded-xl hover:bg-green-800 transition-all duration-200 font-bold shadow-lg hover:shadow-xl"
          >
            Student Login →
          </a>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-bold text-gray-700 mb-2">
            No comments yet
          </h4>
          <p className="text-gray-600 font-medium">
            Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(null)}
        />
      )}
    </div>
  );
};

export default CommentSection;
