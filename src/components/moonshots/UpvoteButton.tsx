import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { checkUserUpvote, toggleUpvote, fetchUpvoteCount } from "../../utils/nostr";
import { FiHeart } from "react-icons/fi";

interface UpvoteButtonProps {
  moonshotId: string;
  creatorPubkey: string;
}

function UpvoteButton({ moonshotId, creatorPubkey }: UpvoteButtonProps) {
  const { isAuthenticated, userPubkey } = useAuth();
  const [count, setCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpvoteData = async () => {
      try {
        const upvoteCount = await fetchUpvoteCount(moonshotId, creatorPubkey);
        setCount(upvoteCount);

        if (userPubkey) {
          const userUpvoted = await checkUserUpvote(moonshotId, creatorPubkey, userPubkey);
          setHasUpvoted(userUpvoted);
        }
      } catch (error) {
        console.error("Failed to load upvote data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUpvoteData();
  }, [moonshotId, creatorPubkey, userPubkey]);

  async function handleUpvote() {
    if (loading) return;

    if (!isAuthenticated) {
      document.dispatchEvent(new CustomEvent("nlLaunch", { detail: "login" }));
      return;
    }

    setLoading(true);
    try {
      await toggleUpvote(moonshotId, creatorPubkey, hasUpvoted);
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
        hasUpvoted
          ? "border-bitcoin bg-bitcoin text-black shadow-[0_0_20px_rgba(247,147,26,0.4)]"
          : "border-white/15 bg-white/5 text-gray-200 hover:border-bitcoin/60 hover:text-bitcoin hover:bg-black/40"
      } ${loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      title="Upvote"
    >
      <FiHeart className={`text-sm ${hasUpvoted ? "fill-black text-black" : "text-bitcoin"}`} />
      <span>{loading ? "…" : count}</span>
    </button>
  );
}

export default UpvoteButton;
