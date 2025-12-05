import { useState, useEffect } from "react";
import { BsChat, BsChevronDown, BsChevronUp } from "react-icons/bs";
import type { Comment, UserProfile } from "../../types/types";
import { buildCommentTree } from "../../utils/nostr/comments";
import { fetchUserProfile } from "../../utils/nostr";
import CommentInput from "./CommentInput";
import CommentItem from "./CommentItem";

interface CommentSectionProps {
  moonshotId: string;
  moonshotCreatorPubkey: string;
  fetchedComments: Comment[];
  isAuthenticated: boolean;
  isCollapsed?: boolean;
}

function CommentSection({
  fetchedComments,
  moonshotId,
  moonshotCreatorPubkey,
  isAuthenticated,
  isCollapsed = false,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(20);
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);

  const loadComments = async () => {
    setLoading(true);
    try {
      const commentTree = buildCommentTree(fetchedComments);
      setComments(commentTree);

      // Fetch profiles for all unique comment authors
      const uniqueAuthors = [...new Set(fetchedComments.map(c => c.authorPubkey))];
      const profilePromises = uniqueAuthors.map(pubkey => fetchUserProfile(pubkey));
      const profiles = await Promise.all(profilePromises);

      const profileMap = new Map<string, UserProfile>();
      profiles.forEach((profile, index) => {
        if (profile) {
          profileMap.set(uniqueAuthors[index], profile);
        }
      });
      setUserProfiles(profileMap);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [moonshotId, moonshotCreatorPubkey, fetchedComments]);

  const handleCommentSuccess = () => {
    loadComments();
  };

  const handleReplySubmit = () => {
    loadComments();
  };

  // Count total comments including replies
  const countAllComments = (commentList: Comment[]): number => {
    return commentList.reduce((total, comment) => {
      return total + 1 + (comment.replies ? countAllComments(comment.replies) : 0);
    }, 0);
  };

  const totalComments = countAllComments(comments);

  const displayedComments = comments.slice(0, displayCount);
  const hasMore = comments.length > displayCount;

  return (
    <div className="card-style p-6 mt-6">
      {/* Header - Clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-6 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <BsChat className="text-sky-400 text-xl" />
          <h2 className="text-2xl font-bold text-white">
            Comments {totalComments > 0 && `(${totalComments})`}
          </h2>
        </div>
        {isExpanded ? (
          <BsChevronUp className="text-sky-400 text-xl" />
        ) : (
          <BsChevronDown className="text-sky-400 text-xl" />
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <>
          {/* Comment Input (if authenticated) */}
          {isAuthenticated ? (
            <div className="mb-6">
              <CommentInput
                moonshotId={moonshotId}
                moonshotCreatorPubkey={moonshotCreatorPubkey}
                onSuccess={handleCommentSuccess}
              />
            </div>
          ) : (
            <div className="mb-6 bg-sky-900/10 border border-sky-500/30 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm mb-2">Login to join the conversation</p>
              <button
                onClick={() =>
                  document.dispatchEvent(new CustomEvent("nlLaunch", { detail: "welcome-login" }))
                }
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded transition-colors"
              >
                Login
              </button>
            </div>
          )}

          {/* Comments List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full border-2 border-sky-600/20 border-t-sky-500 animate-spin"></div>
              <p className="text-gray-400 text-sm">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 border border-sky-500/20 rounded-lg">
              <p className="text-gray-400">No comments yet</p>
              <p className="text-gray-500 text-sm mt-1">Be the first to comment!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {displayedComments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    userProfile={userProfiles.get(comment.authorPubkey)}
                    moonshotId={moonshotId}
                    moonshotCreatorPubkey={moonshotCreatorPubkey}
                    isAuthenticated={isAuthenticated}
                    onReplySubmit={handleReplySubmit}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setDisplayCount(prev => prev + 20)}
                    className="px-6 py-2 bg-sky-900/20 hover:bg-sky-900/30 border border-sky-500/30 text-sky-300 text-sm font-semibold rounded transition-colors"
                  >
                    Load More Comments
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default CommentSection;
