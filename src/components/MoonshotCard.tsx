import { FiHeart, FiUsers } from "react-icons/fi";
import type { Moonshot, UserProfile } from "../types/types";
import { useEffect, useState } from "react";
import { fetchUpvoteCount, fetchInterests, fetchUserProfile } from "../utils/nostr";

interface MoonshotCardProps {
  moonshot: Moonshot;
  onClick: () => void;
}


function MoonshotCard({ moonshot, onClick }: MoonshotCardProps) {
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [interestCount, setInterestCount] = useState(0);
  const [creatorProfile, setCreatorProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCardData = async () => {
      try {
        // Fetch upvote count, interests, and creator profile in parallel
        const [upvotes, interests, profile] = await Promise.all([
          fetchUpvoteCount(moonshot.eventId),
          fetchInterests(moonshot.eventId),
          fetchUserProfile(moonshot.creatorPubkey)
        ]);

        setUpvoteCount(upvotes);
        setInterestCount(interests.length);
        setCreatorProfile(profile);
      } catch (error) {
        console.error('Failed to load card data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCardData();
  }, [moonshot.eventId, moonshot.creatorPubkey]);

  return (
    <div
      onClick={onClick}
      className="card-style hover:border-sky-300/40 transition-all duration-300 p-6 cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white font-bold text-xl group-hover:text-sky-200 transition-colors line-clamp-1 flex-1 mr-4">
          {moonshot.title}
        </h3>
        <div className="flex items-center gap-4 text-sm shrink-0">
          <div className="flex items-center gap-1 text-red-400">
            <FiHeart className="text-lg" />
            <span>{upvoteCount}</span>
          </div>
          <div className="flex items-center gap-1 text-sky-400">
            <FiUsers className="text-lg" />
            <span>{interestCount}</span>
          </div>
        </div>
      </div>

      {/* Creator Info */}
      <div className="flex items-center gap-3 mb-3">
        {creatorProfile?.picture ? (
          <img
            src={creatorProfile.picture}
            alt={creatorProfile.name || "Creator"}
            className="w-6 h-6 rounded-full border border-sky-500/30"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-sky-900/50 border border-sky-500/30 flex items-center justify-center">
            <span className="text-sky-300 text-xs font-bold">
              {moonshot.creatorPubkey.slice(0, 2)}
            </span>
          </div>
        )}
        <span className="text-sky-300 text-sm">
          {creatorProfile?.name || `${moonshot.creatorPubkey.slice(0, 8)}...`}
        </span>
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
            moonshot.status === 'in-progress' ? 'bg-blue-900/20 border-blue-500/20 text-blue-300' :
            moonshot.status === 'completed' ? 'bg-purple-900/20 border-purple-500/20 text-purple-300' :
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