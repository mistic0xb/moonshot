import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import MoonshotDetailView from "../components/moonshots/MoonshotDetailView";
import type { Moonshot } from "../types/types";
import { fetchMoonshotById } from "../utils/nostr";

function MoonshotCreatorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [moonshot, setMoonshot] = useState<Moonshot | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleMoonshotUpdate = (updatedMoonshot: Moonshot) => {
    setMoonshot(updatedMoonshot);
  };

  const handleMoonshotDeleted = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-white/20 border-t-bitcoin animate-spin" />
          <p className="text-xs text-gray-400">Loading moonshot...</p>
        </div>
      </div>
    );
  }

  if (!moonshot) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Moonshot Not Found</h2>
          <p className="text-sm text-gray-400 mb-4">
            The moonshot you're looking for doesn't exist.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center rounded-full bg-bitcoin px-6 py-2 text-xs font-semibold uppercase tracking-wide text-black hover:bg-orange-400 transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <MoonshotDetailView
      moonshot={moonshot}
      onBack={handleBack}
      onMoonshotUpdate={handleMoonshotUpdate}
      onMoonshotDeleted={handleMoonshotDeleted}
    />
  );
}

export default MoonshotCreatorPage;
