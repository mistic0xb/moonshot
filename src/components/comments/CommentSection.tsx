import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  onCommentAdded?: () => void;
}

function CommentSection({
  fetchedComments,
  moonshotId,
  moonshotCreatorPubkey,
  isAuthenticated,
  isCollapsed = false,
  onCommentAdded,
}: CommentSectionProps) {
  const [displayCount, setDisplayCount] = useState(20);
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  const [refreshKey, setRefreshKey] = useState(0);

  // Build comment tree (this is fast, so we can do it synchronously)
  const comments = buildCommentTree(fetchedComments);

  // Fetch user profiles for all comment authors
  const uniqueAuthors = [...new Set(fetchedComments.map(c => c.authorPubkey))];
  
  const userProfilesQuery = useQuery({
    queryKey: ["comment-profiles", moonshotId, uniqueAuthors, refreshKey],
    queryFn: async () => {
      const profilePromises = uniqueAuthors.map(pubkey => 
        fetchUserProfile(pubkey).catch(err => {
          console.error(`Failed to fetch profile for ${pubkey}:`, err);
          return null;
        })
      );
      const profiles = await Promise.all(profilePromises);

      const profileMap = new Map<string, UserProfile>();
      profiles.forEach((profile, index) => {
        if (profile) {
          profileMap.set(uniqueAuthors[index], profile);
        }
      });
      
      return profileMap;
    },
    enabled: uniqueAuthors.length > 0,
    staleTime: 5 * 60 * 1000, // Cache profiles for 5 minutes
  });

  const handleCommentSuccess = () => {
    // Trigger a refresh by changing the key
    setRefreshKey(prev => prev + 1);
    // Notify parent to refetch comments
    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  const handleReplySubmit = () => {
    // Trigger a refresh by changing the key
    setRefreshKey(prev => prev + 1);
    // Notify parent to refetch comments
    if (onCommentAdded) {
      onCommentAdded();
    }
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
  const userProfiles = userProfilesQuery.data ?? new Map();
  const loading = userProfilesQuery.isPending;

  return (
    <div className="mt-6 rounded-2xl border border-white/5 bg-card/70 p-5 sm:p-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-5 flex w-full items-center justify-between text-left hover:opacity-90 transition-opacity cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
            <BsChat className="text-bitcoin text-lg" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Comments {totalComments > 0 && `(${totalComments})`}
            </h2>
            <p className="text-xs text-gray-500">
              Share feedback, questions, or ideas with the creator.
            </p>
          </div>
        </div>
        {isExpanded ? (
          <BsChevronUp className="text-gray-400" />
        ) : (
          <BsChevronDown className="text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <>
          {/* Input / Login prompt */}
          {isAuthenticated ? (
            <div className="mb-5">
              <CommentInput
                moonshotId={moonshotId}
                moonshotCreatorPubkey={moonshotCreatorPubkey}
                onSuccess={handleCommentSuccess}
              />
            </div>
          ) : (
            <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="mb-2 text-xs sm:text-sm text-gray-400">
                Login to join the conversation.
              </p>
              <button
                onClick={() =>
                  document.dispatchEvent(new CustomEvent("nlLaunch", { detail: "welcome-login" }))
                }
                className="rounded-full bg-bitcoin px-4 py-2 text-xs font-semibold text-black hover:bg-orange-400 transition-colors cursor-pointer"
              >
                Login
              </button>
            </div>
          )}

          {/* Comments list */}
          {loading ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 h-6 w-6 rounded-full border-2 border-white/15 border-t-bitcoin animate-spin" />
              <p className="text-xs text-gray-400">Loading comments…</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 py-8 text-center">
              <p className="text-sm text-gray-400">No comments yet.</p>
              <p className="mt-1 text-xs text-gray-500">Be the first to comment.</p>
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

              {hasMore && (
                <div className="mt-5 text-center">
                  <button
                    onClick={() => setDisplayCount(prev => prev + 20)}
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-gray-200 hover:border-bitcoin/60 hover:text-bitcoin hover:bg-black/40 transition-colors cursor-pointer"
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