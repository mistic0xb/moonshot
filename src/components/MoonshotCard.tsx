import { FiHeart } from "react-icons/fi";
import type { Moonshot } from "../types/types";
import { useEffect, useState } from "react";
import { fetchUpvoteCount } from "../utils/nostr";

interface MoonshotCardProps {
  moonshot: Moonshot;
  onClick: () => void;
}

function MoonshotCard({ moonshot, onClick }: MoonshotCardProps) {
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpvoteData = async () => {
      try {
        // Fetch count
        const upvoteCount = await fetchUpvoteCount(moonshot.eventId);
        setUpvoteCount(upvoteCount);
      } catch (error) {
        console.error('Failed to load upvote data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUpvoteData();
  }, [moonshot.eventId]);

  return (
    <div
      onClick={onClick}
      className="card-style hover:border-sky-300/40 transition-all duration-300 p-6 cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white font-bold text-xl group-hover:text-sky-200 transition-colors line-clamp-1">
          {moonshot.title}
        </h3>
        <div className="flex items-center gap-4 text-sm shrink-0 ml-4">
          <div className="flex items-center gap-1 text-red-400">
            <FiHeart className="text-lg" />
            <span>{upvoteCount}</span>
          </div>
        </div>
      </div>

      {/* Topics */}
      {moonshot.topics && moonshot.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {moonshot.topics.slice(0, 3).map((topic, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-sky-900/20 border border-sky-500/20 text-sky-300 text-xs rounded"
            >
              #{topic}
            </span>
          ))}
          {moonshot.topics.length > 3 && (
            <span className="px-2 py-1 bg-gray-800 border border-gray-600 text-gray-400 text-xs rounded">
              +{moonshot.topics.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-4 text-xs text-gray-500">
        <span className="px-3 py-1 bg-sky-900/20 border border-sky-500/20">
          {moonshot.budget} sats
        </span>
        <span className="px-3 py-1 bg-sky-900/20 border border-sky-500/20">
          {moonshot.timeline} months
        </span>
        {moonshot.status && (
          <span className={`px-3 py-1 border ${
            moonshot.status === 'open' ? 'bg-green-900/20 border-green-500/20 text-green-300' :
            moonshot.status === 'in-progress' ? 'bg-blue-900/20 border-green-500/20 text-green-300' :
            moonshot.status === 'completed' ? 'bg-blue-900/20 border-blue-500/20 text-blue-300' :
            'bg-gray-800 border-gray-600 text-gray-400'
          }`}>
            {moonshot.status}
          </span>
        )}
      </div>
    </div>
  );
}

export default MoonshotCard;