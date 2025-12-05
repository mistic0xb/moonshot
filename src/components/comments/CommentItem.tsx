import { useState } from "react";
import { BsReply, BsCoin, BsChevronUp, BsChevronDown } from "react-icons/bs";
import type { Comment, UserProfile } from "../../types/types";
import CommentInput from "./CommentInput";

interface CommentItemProps {
  comment: Comment;
  userProfile?: UserProfile;
  moonshotId: string;
  moonshotCreatorPubkey: string;
  isAuthenticated: boolean;
  onReplySubmit: (parentCommentId: string, parentAuthorPubkey: string) => void;
  depth?: number;
}

function CommentItem({
  comment,
  userProfile,
  moonshotId,
  moonshotCreatorPubkey,
  isAuthenticated,
  onReplySubmit,
  depth = 0,
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false); // NEW: collapsed by default
  const maxDepth = 3; // Limit nesting depth

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleReplyClick = () => {
    if (!isAuthenticated) {
      document.dispatchEvent(new CustomEvent("nlLaunch", { detail: "welcome-login" }));
      return;
    }
    setShowReplyInput(!showReplyInput);
  };

  const handleReplySuccess = () => {
    setShowReplyInput(false);
    onReplySubmit(comment.eventId, comment.authorPubkey);
  };

  return (
    <div className={`${depth > 0 ? "ml-8 mt-3" : ""}`}>
      <div className="bg-sky-900/5 border border-sky-500/20 rounded-lg p-4">
        {/* Comment Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          {userProfile?.picture ? (
            <img
              src={userProfile.picture}
              alt={userProfile.name || "User"}
              className="w-9 h-9 rounded-full border border-sky-500/30 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-sky-900/50 border border-sky-500/30 flex items-center justify-center shrink-0">
              <span className="text-sky-300 text-xs font-bold">
                {comment.authorPubkey.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          {/* Author & Time */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sky-300 font-semibold text-sm">
                {userProfile?.name || `${comment.authorPubkey.slice(0, 8)}...`}
              </span>
              <span className="text-gray-500 text-xs">•</span>
              <span className="text-gray-500 text-xs">{formatDate(comment.createdAt)}</span>

              {/* Chip-In Badge */}
              {comment.chipIn > 0 && (
                <>
                  <span className="text-gray-500 text-xs">•</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-900/20 border border-amber-500/30 text-amber-300 text-xs rounded-full">
                    <BsCoin className="text-xs" />
                    {comment.chipIn.toLocaleString()} sats
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Comment Content */}
        <div className="text-gray-200 text-sm whitespace-pre-wrap wrap-break-word mb-3 ml-12">
          {comment.content}
        </div>

        {/* Reply Button */}
        {depth < maxDepth && (
          <div className="ml-12 flex items-center gap-4">
            <button
              onClick={handleReplyClick}
              className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 text-xs font-medium transition-colors"
            >
              <BsReply className="text-sm" />
              Reply
            </button>

            {/* Show/Hide Replies Button */}
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-300 text-xs font-medium transition-colors"
              >
                {showReplies ? (
                  <>
                    <BsChevronUp className="text-sm" />
                    Hide {comment.replies.length}{" "}
                    {comment.replies.length === 1 ? "reply" : "replies"}
                  </>
                ) : (
                  <>
                    <BsChevronDown className="text-sm" />
                    Show {comment.replies.length}{" "}
                    {comment.replies.length === 1 ? "reply" : "replies"}
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Reply Input */}
        {showReplyInput && (
          <div className="ml-12 mt-3">
            <CommentInput
              moonshotId={moonshotId}
              moonshotCreatorPubkey={moonshotCreatorPubkey}
              parentCommentId={comment.eventId}
              parentAuthorPubkey={comment.authorPubkey}
              onSuccess={handleReplySuccess}
              onCancel={() => setShowReplyInput(false)}
              placeholder={`Reply to ${userProfile?.name || "comment"}...`}
            />
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && showReplies && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              userProfile={undefined} // Will be fetched separately
              moonshotId={moonshotId}
              moonshotCreatorPubkey={moonshotCreatorPubkey}
              isAuthenticated={isAuthenticated}
              onReplySubmit={onReplySubmit}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentItem;
