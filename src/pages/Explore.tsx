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
    const fetchData = async () => {
      try {
        const allMoonshots = await fetchAllMoonshots();
        const explorableMoonshots = allMoonshots.filter(
          moonshot => moonshot.isExplorable !== false
        );
        setMoonshots(explorableMoonshots);
      } catch (err) {
        console.error("ERROR: fetching all moonshots", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const SkeletonCard = () => (
    <div className="card-style border border-white/5 bg-card/40 rounded-2xl p-6 animate-pulse">
      <div className="h-5 w-24 bg-white/10 rounded-full mb-4" />
      <div className="h-7 w-3/4 bg-white/10 rounded mb-3" />
      <div className="h-4 w-full bg-white/5 rounded mb-2" />
      <div className="h-4 w-5/6 bg-white/5 rounded mb-6" />
      <div className="flex items-center justify-between mt-2">
        <div className="h-4 w-24 bg-white/5 rounded-full" />
        <div className="h-9 w-28 bg-white/10 rounded-full" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-dark pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Explore <span className="gradient-text">Moonshots</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Discover ambitious projects looking for talented builders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-red-400/20 border-t-red-300 animate-spin" />
          <p className="text-red-400 text-lg mb-2">Error fetching moonshots.</p>
          <p className="text-gray-500 text-sm">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Explore <span className="gradient-text">Moonshots</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto">
            Discover ambitious, Bitcoin-powered ideas and connect directly with the builders behind
            them.
          </p>
        </div>

        {/* Content */}
        {moonshots.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">No moonshots found yet.</p>
            <button
              onClick={() => navigate("/create")}
              className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-bitcoin hover:bg-orange-400 text-black font-semibold text-sm uppercase tracking-wide transition-colors"
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
