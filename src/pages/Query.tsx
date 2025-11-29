import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import UpvoteButton from "../components/UpvoteButton";
import InterestDialog from "../components/InterestDialog";
import type { Moonshot } from "../types/types";
import RichTextViewer from "../components/RichTextViewer";

function Query() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [moonshot, setMoonshot] = useState<Moonshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInterestDialog, setShowInterestDialog] = useState(false);

  useEffect(() => {
    // TODO: Fetch moonshot by ID from Nostr
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, [id]);

  const handleUpvote = async () => {
    // TODO: Publish upvote event (kind 7)
    console.log("Upvoting moonshot:", id);
  };

  const handleInterestClick = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Launch login dialog
      document.dispatchEvent(new CustomEvent("nlLaunch", { detail: "welcome-login" }));
      return;
    }

    // User is authenticated, show interest dialog
    setShowInterestDialog(true);
  };

  const handleInterestSubmit = async (message: string, github?: string) => {
    // TODO: Publish interest event
    console.log("Interest submitted:", { message, github });
    setShowInterestDialog(false);
    alert("Interest submitted successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blackish flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-sky-600/20 border-t-sky-500 animate-spin"></div>
          <p className="text-sky-300 text-lg">Loading moonshot...</p>
        </div>
      </div>
    );
  }

  if (!moonshot) {
    return (
      <div className="min-h-screen bg-blackish flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Moonshot Not Found</h2>
          <p className="text-gray-400">The moonshot you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-blackish py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="card-style p-8 mb-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-4xl font-bold text-white">{moonshot.title}</h1>
              <UpvoteButton initialCount={moonshot.upvotes} onUpvote={handleUpvote} />
            </div>

            <div className="flex gap-4 mb-6 flex-wrap">
              <span className="px-4 py-2 bg-sky-900/20 border border-sky-500/30 text-sky-300 text-sm font-semibold rounded">
                {moonshot.budget} sats
              </span>
              <span className="px-4 py-2 bg-sky-900/20 border border-sky-500/30 text-sky-300 text-sm font-semibold rounded">
                {moonshot.timeline}
              </span>
              <span className="px-4 py-2 bg-sky-900/20 border border-sky-500/30 text-gray-400 text-sm rounded">
                {moonshot.interests} interested builders
              </span>
            </div>

            <div className="text-gray-300 leading-relaxed prose prose-invert max-w-none mb-8"></div>

            <button
              onClick={handleInterestClick}
              className="w-full bg-sky-300 hover:bg-sky-400 text-sky-950 font-bold py-4 text-lg uppercase tracking-wide transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] cursor-pointer rounded"
            >
              {isAuthenticated ? "I'm Interested" : "Login to Show Interest"}
            </button>
          </div>
        </div>
      </div>

      {showInterestDialog && isAuthenticated && (
        <InterestDialog
          onSubmit={handleInterestSubmit}
          onClose={() => setShowInterestDialog(false)}
        />
      )}
    </>
  );
}

export default Query;
