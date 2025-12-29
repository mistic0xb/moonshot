import { useNavigate } from "react-router";
import MoonshotCard from "../components/moonshots/MoonshotCard";
import { fetchAllMoonshots } from "../utils/nostr";
import { useExportedMoonshots } from "../context/ExportedMoonshotContext";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { Moonshot } from "../types/types";
import { useTrustScores } from "../hooks/useTrustScores";

const TOPICS = [
  "nostr",
  "lightning",
  "web",
  "mobile",
  "react",
  "bitcoin",
  "typescript",
  "design",
  "ai",
  "zaps",
  "relays",
  "lnurl",
];

type SortOption = "trust" | "newest" | "oldest" | "budget-high" | "budget-low";

function Explore() {
  const navigate = useNavigate();
  const { isExported } = useExportedMoonshots();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("trust");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch moonshots
  const {
    isPending: moonshotsLoading,
    isError,
    data,
    error: err,
  } = useQuery({
    queryKey: ["all-moonshots"],
    queryFn: fetchAllMoonshots,
  });

  // Extract unique pubkeys from moonshots
  const pubkeys = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map(m => m.creatorPubkey))];
  }, [data]);

  // Fetch trust scores for all creators
  const { data: trustScores, isPending: trustLoading } = useTrustScores(pubkeys);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTopics([]);
    setSortBy("trust");
  };

  const filteredAndSortedMoonshots: Moonshot[] = useMemo(() => {
    if (!data) return [];

    let filtered = data.filter(moonshot => moonshot?.isExplorable !== false);

    // Search by title
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(moonshot => moonshot.title.toLowerCase().includes(query));
    }

    // Filter by topics
    if (selectedTopics.length > 0) {
      filtered = filtered.filter(moonshot =>
        moonshot.topics?.some(topic => selectedTopics.includes(topic.toLowerCase()))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "trust": {
          const rankA = trustScores?.get(a.creatorPubkey)?.rank ?? 0;
          const rankB = trustScores?.get(b.creatorPubkey)?.rank ?? 0;
          return rankB - rankA; // Higher rank first
        }
        case "newest":
          return b.createdAt - a.createdAt;
        case "oldest":
          return a.createdAt - b.createdAt;
        case "budget-high":
          return parseInt(b.budget || "0") - parseInt(a.budget || "0");
        case "budget-low":
          return parseInt(a.budget || "0") - parseInt(b.budget || "0");
        default:
          return 0;
      }
    });

    return filtered;
  }, [data, searchQuery, selectedTopics, sortBy, trustScores]);

  if (moonshotsLoading) {
    return (
      <div className="min-h-screen bg-dark pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Explore <span className="gradient-text">Moonshots</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base">Loading moonshots...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    console.log("ERROR:", err);
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Error fetching moonshots.</p>
          <p className="text-gray-500 text-sm">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  const moonshots = data.filter(moonshot => moonshot?.isExplorable !== false);
  const hasActiveFilters = searchQuery || selectedTopics.length > 0 || sortBy !== "trust";

  return (
    <div className="min-h-screen bg-dark pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Explore <span className="gradient-text">Moonshots</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto">
            Find something you can build? show interest and get em sats!
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-blackish border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-bitcoin transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 bg-blackish border border-gray-700/60 rounded-lg text-white focus:outline-none focus:border-yellow-600 transition-colors cursor-pointer"
            >
              <option value="trust">Trust Rank</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="budget-high">Highest Budget</option>
              <option value="budget-low">Lowest Budget</option>
            </select>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                selectedTopics.length > 0
                  ? "bg-gray-500 text-black"
                  : "bg-blackish text-white border border-gray-700/60 hover:border-gray-600"
              }`}
            >
              Filters {selectedTopics.length > 0 && `(${selectedTopics.length})`}
            </button>
          </div>

          {/* Topics Filter */}
          {showFilters && (
            <div className="bg-blackish border border-gray-700/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Filter by Topics</h3>
                {selectedTopics.length > 0 && (
                  <button
                    onClick={() => setSelectedTopics([])}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Clear Topics
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(topic => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedTopics.includes(topic)
                        ? "bg-yellow-600/90 text-black"
                        : "bg-blackish border border-gray-700/60 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {(hasActiveFilters || trustLoading) && (
            <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
              <p className="text-gray-400 text-sm">
                Showing {filteredAndSortedMoonshots.length} of {moonshots.length} moonshots
                {trustLoading && " • Loading trust scores..."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-bitcoin hover:text-orange-400 transition-colors font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {filteredAndSortedMoonshots.length === 0 ? (
          <div className="text-center py-16">
            {moonshots.length === 0 ? (
              <>
                <p className="text-gray-400 text-lg mb-4">No moonshots found yet.</p>
                <button
                  onClick={() => navigate("/create")}
                  className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-bitcoin hover:bg-orange-400 text-black font-semibold text-sm uppercase tracking-wide transition-colors"
                >
                  Create First Moonshot
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-400 text-lg mb-4">No moonshots match your filters.</p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-bitcoin hover:bg-orange-400 text-black font-semibold text-sm uppercase tracking-wide transition-colors"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAndSortedMoonshots.map(moonshot => {
              const exported = isExported(moonshot.eventId);
              const trustMetrics = trustScores?.get(moonshot.creatorPubkey);

              return (
                <MoonshotCard
                  key={moonshot.id}
                  moonshot={moonshot}
                  isExported={exported}
                  onClick={() => navigate(`/moonshot/${moonshot.id}`)}
                  trustRank={trustMetrics?.rank}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
