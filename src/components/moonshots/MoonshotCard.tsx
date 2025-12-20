import { FiHeart, FiUsers, FiClock, FiZap } from "react-icons/fi";
import { BsArrowRight } from "react-icons/bs";
import type { Moonshot, UserProfile } from "../../types/types";
import { useEffect, useState } from "react";
import { fetchUpvoteCount, fetchInterests, fetchUserProfile } from "../../utils/nostr";
import { nip19 } from "nostr-tools";

interface MoonshotCardProps {
  moonshot: Moonshot;
  isExported: boolean;
  onClick: () => void;
}

function MoonshotCard({ moonshot, isExported, onClick }: MoonshotCardProps) {
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
    exported: "bg-bitcoin/10 border-bitcoin/40 text-bitcoin",
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-card/60 border border-white/5 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:border-bitcoin/40 hover:bg-card/80 hover:shadow-[0_0_40px_rgba(247,147,26,0.08)]"
    >
      {/* Status Badge */}
      {(moonshot.status || isExported) && (
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full border ${
              statusStyles[isExported ? "exported" : moonshot.status] ||
              "bg-white/5 border-white/10 text-gray-400"
            }`}
          >
            {isExported ? "Exported to Angor" : moonshot.status}
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
          <div className="flex items-center justify-center">
            <img
              src={"/src/assets/default-avatar.jpg"}
              className="w-8 h-8 rounded-full border border-white/10 object-cover"
            />
          </div>
        )}
        <span className="text-gray-300 text-sm font-medium">{creatorProfile?.name}</span>

        {!creatorProfile?.name && (
          <span className="text-gray-500 text-xs break-all max-w-90 leading-tight">
            {nip19.npubEncode(moonshot.creatorPubkey)}
          </span>
        )}
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

        <div className="flex items-center gap-1.5 text-gray-500">
          <FiClock />
          <span>{timeAgo(moonshot.createdAt)}</span>
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

function timeAgo(timestampMs: number) {
  console.log("TIMESTAMP (ms):", timestampMs);
  
  const seconds = Math.floor((Date.now() - timestampMs) / 1000);

  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
    { label: "s", seconds: 1 },
  ];

  for (const i of intervals) {
    const count = Math.floor(seconds / i.seconds);
    if (count >= 1) return `${count}${i.label} ago`;
  }

  return "just now";
}