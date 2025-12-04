import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import MoonshotCard from "../components/moonshots/MoonshotCard";
import type { Moonshot } from "../types/types";
import { fetchAllMoonshots } from "../utils/nostr";

function Explore() {
  const navigate = useNavigate();
  const [moonshots, setMoonshots] = useState<Moonshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fetch moonshots from Nostr relays
    const fetchData = async () => {
      try {
        const allMoonshots = await fetchAllMoonshots();
        
        // Filter to only show explorable moonshots
        const explorableMoonshots = allMoonshots.filter(
          moonshot => moonshot.isExplorable !== false
        );
        
        setMoonshots(explorableMoonshots);
      } catch (err) {
        console.error(`ERROR: fetching all moonshots`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-blackish flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-sky-600/20 border-t-sky-200 animate-spin"></div>
          <p className="text-sky-300 text-lg">Loading moonshots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blackish flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-red-400/20 border-t-red-200 animate-spin"></div>
          <p className="text-red-500 text-lg">Error fetching moonshots!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blackish py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Explore <span className="text-sky-200">Moonshots</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Discover ambitious projects looking for talented builders
          </p>
        </div>

        {moonshots.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No moonshots found</p>
            <button
              onClick={() => navigate("/create")}
              className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-3 font-semibold uppercase transition-colors rounded"
            >
              Create First Moonshot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {moonshots.map(moonshot => (
              <MoonshotCard
                key={moonshot.id}
                moonshot={moonshot}
                onClick={() => navigate(`/moonshot/${moonshot.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;