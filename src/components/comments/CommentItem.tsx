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
  allUserProfiles?: Map<string, UserProfile>;
}

function CommentItem({
  comment,
  userProfile,
  moonshotId,
  moonshotCreatorPubkey,
  isAuthenticated,
  onReplySubmit,
  depth = 0,
  allUserProfiles = new Map(),
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const maxDepth = 3;

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
    <div className={depth > 0 ? "ml-4 sm:ml-8 mt-3" : ""}>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 sm:p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {userProfile?.picture ? (
            <img
              src={userProfile.picture}
              alt={userProfile.name || "User"}
              className="h-8 w-8 shrink-0 rounded-full border border-white/15 object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-bitcoin to-nostr text-[10px] font-bold text-white">
              {comment.authorPubkey.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-100">
                {userProfile?.name || `${comment.authorPubkey.slice(0, 8)}...`}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">{formatDate(comment.createdAt)}</span>

              {comment.chipIn > 0 && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300 border border-amber-500/30">
                    <BsCoin className="text-xs" />
                    {comment.chipIn.toLocaleString()} sats
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-3 text-xs sm:text-sm text-gray-100 whitespace-pre-wrap wrap-break-words ml-10">
          {comment.content}
        </div>

        {/* Actions */}
        {depth < maxDepth && (
          <div className="ml-10 flex flex-wrap items-center gap-3">
            <button
              onClick={handleReplyClick}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-bitcoin hover:text-orange-300 transition-colors"
            >
              <BsReply className="text-xs" />
              Reply
            </button>

            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showReplies ? (
                  <>
                    <BsChevronUp className="text-xs" />
                    Hide {comment.replies.length}{" "}
                    {comment.replies.length === 1 ? "reply" : "replies"}
                  </>
                ) : (
                  <>
                    <BsChevronDown className="text-xs" />
                    Show {comment.replies.length}{" "}
                    {comment.replies.length === 1 ? "reply" : "replies"}
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Reply input */}
        {showReplyInput && (
          <div className="ml-10 mt-3">
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

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && showReplies && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              userProfile={allUserProfiles.get(reply.authorPubkey)}
              moonshotId={moonshotId}
              moonshotCreatorPubkey={moonshotCreatorPubkey}
              isAuthenticated={isAuthenticated}
              onReplySubmit={onReplySubmit}
              depth={depth + 1}
              allUserProfiles={allUserProfiles}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentItem;
