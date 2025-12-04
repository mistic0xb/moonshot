import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { checkUserUpvote, toggleUpvote, fetchUpvoteCount } from "../../utils/nostr";
import { FiHeart } from "react-icons/fi";

interface UpvoteButtonProps {
  moonshotEventId: string;
  creatorPubkey: string;
}

function UpvoteButton({ moonshotEventId, creatorPubkey }: UpvoteButtonProps) {
  const { isAuthenticated, userPubkey } = useAuth();
  const [count, setCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpvoteData = async () => {
      try {
        // Fetch count
        const upvoteCount = await fetchUpvoteCount(moonshotEventId);
        setCount(upvoteCount);

        // Check if current user upvoted
        if (userPubkey) {
          const userUpvoted = await checkUserUpvote(moonshotEventId, userPubkey);
          setHasUpvoted(userUpvoted);
        }
      } catch (error) {
        console.error("Failed to load upvote data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUpvoteData();
  }, [moonshotEventId, userPubkey]);

  async function handleUpvote() {
    if (loading) return;

    if (!isAuthenticated) {
      document.dispatchEvent(new CustomEvent("nlLaunch", { detail: "login" }));
      return;
    }

    setLoading(true);
    try {
      await toggleUpvote(moonshotEventId, creatorPubkey, hasUpvoted);

      // Update local state
      setHasUpvoted(!hasUpvoted);
      setCount(prev => (hasUpvoted ? prev - 1 : prev + 1));
    } catch (error) {
      console.error("Failed to toggle upvote:", error);
      alert("Failed to upvote. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 border transition-all rounded ${
        hasUpvoted
          ? "bg-sky-600 border-sky-600 text-white"
          : "border-sky-500/50 text-sky-400 hover:border-sky-400"
      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <FiHeart className="text-xl" />
      <span>{loading ? "..." : count}</span>
    </button>
  );
}

export default UpvoteButton;
