import { FiHeart, FiUsers, FiClock, FiZap } from "react-icons/fi";
import { BsArrowRight } from "react-icons/bs";
import type { Moonshot, UserProfile } from "../../types/types";
import { useEffect, useState } from "react";
import { fetchUpvoteCount, fetchInterests, fetchUserProfile } from "../../utils/nostr";

interface MoonshotCardProps {
  moonshot: Moonshot;
  onClick: () => void;
}

function MoonshotCard({ moonshot, onClick }: MoonshotCardProps) {
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [interestCount, setInterestCount] = useState(0);
  const [creatorProfile, setCreatorProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadCardData = async () => {
      try {
        const [upvotes, interests, profile] = await Promise.all([
          fetchUpvoteCount(moonshot.id, moonshot.creatorPubkey),
          fetchInterests(moonshot.id, moonshot.creatorPubkey),
          fetchUserProfile(moonshot.creatorPubkey),
        ]);

        setUpvoteCount(upvotes);
        setInterestCount(interests.length);
        setCreatorProfile(profile);
      } catch (error) {
        console.error("Failed to load card data:", error);
      }
    };

    loadCardData();
  }, [moonshot.id, moonshot.creatorPubkey]);

  const statusStyles: Record<string, string> = {
    open: "bg-green-500/10 border-green-500/30 text-green-400",
    "in-progress": "bg-bitcoin/10 border-bitcoin/30 text-bitcoin",
    completed: "bg-nostr/10 border-nostr/30 text-purple-400",
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-card/60 border border-white/5 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:border-bitcoin/40 hover:bg-card/80 hover:shadow-[0_0_40px_rgba(247,147,26,0.08)]"
    >
      {/* Status Badge */}
      {moonshot.status && (
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full border ${
              statusStyles[moonshot.status] || "bg-white/5 border-white/10 text-gray-400"
            }`}
          >
            {moonshot.status}
          </span>
        </div>
      )}

      {/* Creator Info */}
      <div className="flex items-center gap-3 mb-4">
        {creatorProfile?.picture ? (
          <img
            src={creatorProfile.picture}
            alt={creatorProfile.name || "Creator"}
            className="w-8 h-8 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-bitcoin to-nostr flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {moonshot.creatorPubkey.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-gray-400 text-sm font-medium">
          {creatorProfile?.name || `${moonshot.creatorPubkey.slice(0, 8)}...`}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-white font-bold text-xl mb-2 line-clamp-1 group-hover:text-bitcoin transition-colors">
        {moonshot.title}
      </h3>

      {/* Topics */}
      {moonshot.topics && moonshot.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {moonshot.topics.slice(0, 3).map((topic, index) => (
            <span
              key={index}
              className="px-2.5 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs rounded-full"
            >
              #{topic}
            </span>
          ))}
          {moonshot.topics.length > 3 && (
            <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-gray-500 text-xs rounded-full">
              +{moonshot.topics.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-5">
        <div className="flex items-center gap-1.5">
          <FiZap className="text-bitcoin" />
          <span>{moonshot.budget.toLocaleString()} sats</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FiClock className="text-gray-500" />
          <span>{moonshot.timeline} mo</span>
        </div>
      </div>

      {/* Footer: Engagement + CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-red-400/80">
            <FiHeart />
            <span>{upvoteCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-nostr/80">
            <FiUsers />
            <span>{interestCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm font-medium text-gray-400 group-hover:text-bitcoin transition-colors">
          <span>View</span>
          <BsArrowRight className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

export default MoonshotCard;
