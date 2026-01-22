
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send, User, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-hot-toast";

interface Comment {
  id: string;
  message: string;
  createdAt: string; // or Date, depending on API response parsing
  parentId: string | null;
  ownerId: string;
  authorName: string | null;
  authorImage: string | null;
}

interface CommentSectionProps {
  appointmentTypeId: string;
}

const CommentSection = ({ appointmentTypeId }: CommentSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [appointmentTypeId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentTypeId}/comments`);
      if (!response.ok) throw new Error("Failed to load comments");
      const result = await response.json();
      setComments(result.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to comment");
      return;
    }

    const message = parentId ? replyContent[parentId] : newComment;

    if (!message || !message.trim()) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentTypeId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          parentId: parentId || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to post comment");

      await response.json();

      // Add the new comment to the list immediately
      // The backend returns the raw comment, but for display we might need author info
      // Since it's the current user, we can manually add it for optimistic update or just refetch
      // For simplicity, let's refetch to get server-generated timestamps and author joins
      await fetchComments();

      if (parentId) {
        setReplyContent((prev) => ({ ...prev, [parentId]: "" }));
        setReplyingTo(null);
      } else {
        setNewComment("");
      }
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to post comment");
    }
  };

  const handleReplyChange = (parentId: string, value: string) => {
    setReplyContent((prev) => ({ ...prev, [parentId]: value }));
  };

  // Organize comments into threads
  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const replies = getReplies(comment.id);
    const isReplying = replyingTo === comment.id;
    const [showReplies, setShowReplies] = useState(false);

    return (
      <div className={`group ${isReply ? "ml-12 mt-4" : "mb-8"}`}>
        <div className="flex gap-4">
          <div className="shrink-0">
            {comment.authorImage ? (
              <img
                src={comment.authorImage}
                alt={comment.authorName || "User"}
                className="w-10 h-10 rounded-full object-cover border border-surface-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center border border-surface-200 text-surface-400">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="bg-surface-50 rounded-2xl p-4 border border-surface-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-surface-900 text-sm">
                    {comment.authorName || "Anonymous User"}
                  </h4>
                  <p className="text-xs text-surface-500 font-medium">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <p className="text-surface-700 text-sm leading-relaxed whitespace-pre-wrap">
                {comment.message}
              </p>
            </div>

            <div className="mt-2 flex items-center gap-4 ml-2">
              <button
                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                className="text-xs font-bold text-surface-500 hover:text-rust-600 transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3 h-3" />
                {isReplying ? "Cancel Reply" : "Reply"}
              </button>
            </div>

            {/* Reply Input */}
            {isReplying && (
              <form
                onSubmit={(e) => handleSubmit(e, comment.id)}
                className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2"
              >
                <div className="grow relative">
                  <textarea
                    value={replyContent[comment.id] || ""}
                    onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                    placeholder={`Reply to ${comment.authorName || "user"}...`}
                    className="w-full rounded-xl border-surface-200 bg-white text-sm focus:ring-rust-500 focus:border-rust-500 min-h-[80px] p-3 resize-none shadow-sm"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute bottom-3 right-3 p-2 bg-rust-600 text-white rounded-lg hover:bg-rust-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!replyContent[comment.id]?.trim()}
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>
            )}

             {/* Replies Toggle */}
             {replies.length > 0 && (
                <button 
                    onClick={() => setShowReplies(!showReplies)}
                    className="mt-3 ml-2 text-xs font-bold text-rust-600 hover:text-rust-700 flex items-center gap-1"
                >
                    {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showReplies ? "Hide" : "View"} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </button>
             )}

            {/* Nested Replies */}
            {replies.length > 0 && showReplies && (
              <div className="relative animate-in fade-in slide-in-from-top-2">
                {/* Thread line */}
                <div className="absolute left-[-28px] top-0 bottom-6 w-px bg-surface-200" />
                {replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} isReply={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-surface-400">
        <div className="w-6 h-6 border-2 border-rust-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs font-medium">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-12 border-t border-surface-200">
      <h3 className="text-2xl font-bold text-surface-900 mb-8 flex items-center gap-3">
        Comments <span className="text-sm font-medium bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">{comments.length}</span>
      </h3>

      {/* Main Comment Input */}
      <div className="mb-10 flex gap-4">
        <div className="shrink-0">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-10 h-10 rounded-full object-cover border border-surface-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center border border-surface-200 text-surface-400">
              <User className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="flex-1">
          {user ? (
            <form onSubmit={(e) => handleSubmit(e)} className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ask a question or leave a comment..."
                className="w-full rounded-2xl border-surface-200 bg-white focus:ring-rust-500 focus:border-rust-500 min-h-[100px] p-4 resize-none shadow-sm transition-shadow hover:shadow-md"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                 <button
                  type="submit"
                  className="px-4 py-2 bg-rust-600 text-white text-sm font-bold rounded-xl hover:bg-rust-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newComment.trim()}
                >
                  Post Comment <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          ) : (
             <div className="bg-surface-50 rounded-2xl p-6 text-center border border-surface-200 border-dashed">
                <p className="text-surface-600 font-medium mb-2">Login to post a comment</p>
                <p className="text-xs text-surface-400">Join the discussion and ask questions about this appointment.</p>
             </div>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-2">
        {rootComments.length === 0 ? (
           <p className="text-surface-400 text-center italic py-8">No comments yet. Be the first to ask!</p>
        ) : (
          rootComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
