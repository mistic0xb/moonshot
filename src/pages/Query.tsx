import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import UpvoteButton from "../components/UpvoteButton";
import InterestDialog from "../components/InterestDialog";
import type { Moonshot, ProofOfWorkLink } from "../types/types";
import RichTextViewer from "../components/RichTextViewer";
import { fetchMoonshotById, publishInterest } from "../utils/nostr";

function Query() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [moonshot, setMoonshot] = useState<Moonshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInterestDialog, setShowInterestDialog] = useState(false);

  useEffect(() => {
    const loadMoonshot = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const fetchedMoonshot = await fetchMoonshotById(id);
        setMoonshot(fetchedMoonshot);
      } catch (error) {
        console.error("Failed to fetch moonshot:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMoonshot();
  }, [id]);

  const handleInterestClick = () => {
    if (!isAuthenticated) {
      document.dispatchEvent(new CustomEvent("nlLaunch", { detail: "welcome-login" }));
      return;
    }
    setShowInterestDialog(true);
  };

  const handleInterestSubmit = async (
    message: string,
    github?: string,
    proofOfWorkLinks?: ProofOfWorkLink[]
  ) => {
    if (!moonshot) return;

    try {
      await publishInterest(
        moonshot.id,
        moonshot.eventId, // event ID
        moonshot.creatorPubkey,
        message,
        github,
        proofOfWorkLinks
      );

      setShowInterestDialog(false);
      alert("Interest submitted successfully!");
    } catch (error) {
      console.error("Failed to submit interest:", error);
      alert("Failed to submit interest. Please try again.");
    }
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
              <UpvoteButton
                moonshotEventId={moonshot.eventId}
                creatorPubkey={moonshot.creatorPubkey}
              />
            </div>

            {/* Topics */}
            {moonshot.topics && moonshot.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {moonshot.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-sky-900/20 border border-sky-500/30 text-sky-300 text-sm rounded-full"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-4 mb-6 flex-wrap">
              <span className="px-4 py-2 bg-sky-900/20 border border-sky-500/30 text-sky-300 text-sm font-semibold rounded">
                {moonshot.budget} sats
              </span>
              <span className="px-4 py-2 bg-sky-900/20 border border-sky-500/30 text-sky-300 text-sm font-semibold rounded">
                {moonshot.timeline} months
              </span>
              <span
                className={`px-4 py-2 border text-sm font-semibold rounded ${
                  moonshot.status === "open"
                    ? "bg-green-900/20 border-green-500/30 text-green-300"
                    : moonshot.status === "closed"
                    ? "bg-red-900/20 border-red-500/30 text-red-300"
                    : "bg-gray-800 border-gray-600 text-gray-400"
                }`}
              >
                {moonshot.status}
              </span>
            </div>

            {/* Content */}
            <div className="mb-8">
              <RichTextViewer content={moonshot.content} />
            </div>

            <button
              onClick={handleInterestClick}
              className="w-full bg-sky-300 hover:bg-sky-400 text-sky-950 font-bold py-4 text-lg uppercase tracking-wide transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] cursor-pointer rounded"
            >
              {isAuthenticated ? "I'm Interested" : "Login to Show Interest"}
            </button>
          </div>
        </div>
      </div>

      {showInterestDialog && isAuthenticated && moonshot && (
        <InterestDialog
          moonshotId={moonshot.id}
          moonshotEventId={moonshot.eventId}
          creatorPubkey={moonshot.creatorPubkey}
          onSubmit={handleInterestSubmit}
          onClose={() => setShowInterestDialog(false)}
        />
      )}
    </>
  );
}

export default Query;
