import { useState, useEffect } from "react";
import { BsGithub, BsLink45Deg, BsChat, BsChevronDown, BsChevronUp } from "react-icons/bs";
import { nip19 } from "nostr-tools";
import type { Interest, UserProfile } from "../../types/types";
import { fetchUserProfile } from "../../utils/nostr";
import BuilderChatBox from "./BuilderChatBox";

interface BuilderInfoCardProps {
  interest: Interest;
}

function BuilderInfoCard({ interest }: BuilderInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchUserProfile(interest.builderPubkey);
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to load user profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [interest.builderPubkey]);

  const builderNpub = nip19.npubEncode(interest.builderPubkey);
  const displayName = userProfile?.name || `${builderNpub.slice(0, 8)}...${builderNpub.slice(-4)}`;

  return (
    <div
      className={`rounded-2xl border bg-card/70 p-4 sm:p-5 cursor-pointer transition-all duration-300 ${
        isExpanded ? "border-bitcoin/60 bg-card/90" : "border-white/10 hover:border-white/20"
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header - Always Visible */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Profile Picture */}
          {loadingProfile ? (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 animate-pulse shrink-0" />
          ) : userProfile?.picture ? (
            <img
              src={userProfile.picture}
              alt={displayName}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-bitcoin/30 object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-bitcoin to-nostr border-2 border-white/10 flex items-center justify-center shrink-0">
              <span className="text-white text-xs sm:text-sm font-bold">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          {/* Builder Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                {displayName}
              </h3>
              {userProfile?.name && (
                <span className="text-gray-500 text-[10px] sm:text-xs font-mono bg-white/5 px-2 py-0.5 rounded">
                  {builderNpub.slice(0, 8)}...{builderNpub.slice(-4)}
                </span>
              )}
            </div>

            {/* GitHub Link */}
            {interest.github && (
              <a
                href={
                  interest.github.startsWith("http")
                    ? interest.github
                    : `https://github.com/${interest.github}`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-gray-400 hover:text-bitcoin text-xs sm:text-sm transition-colors w-fit"
              >
                <BsGithub className="shrink-0" />
                <span className="truncate">
                  {interest.github.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "")}
                </span>
              </a>
            )}

            {/* Quick Stats */}
            <div className="flex items-center gap-2 sm:gap-3 mt-1.5 text-[10px] sm:text-xs text-gray-500">
              <span>{interest.proofOfWorkLinks.length} proof(s)</span>
              <span>•</span>
              <span className="truncate">{new Date(interest.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Expand Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={e => {
              e.stopPropagation();
              setShowChat(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-bitcoin px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold uppercase tracking-wide text-black hover:bg-orange-400 transition-colors"
          >
            <BsChat className="text-xs" />
            <span className="hidden sm:inline">Chat</span>
          </button>
          {showChat && <BuilderChatBox interest={interest} onClose={() => setShowChat(false)} />}

          <button
            onClick={e => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="rounded-full p-1.5 text-gray-400 hover:text-bitcoin transition-colors"
          >
            {isExpanded ? <BsChevronUp size={16} /> : <BsChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Message Preview */}
      {!isExpanded && (
        <div className="mt-3">
          <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">{interest.message}</p>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4 animate-in fade-in duration-300">
          {/* About Section (if available) */}
          {userProfile?.about && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                About
              </h4>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-black/40 border border-white/10 p-3 rounded-xl">
                {userProfile.about}
              </p>
            </div>
          )}

          {/* Message */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
              Their Pitch
            </h4>
            <div className="bg-black/40 border border-white/10 rounded-xl p-3">
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {interest.message}
              </p>
            </div>
          </div>

          {/* Proof of Work Links */}
          {interest.proofOfWorkLinks.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Proof of Work ({interest.proofOfWorkLinks.length})
              </h4>
              <div className="space-y-2">
                {interest.proofOfWorkLinks.map((link, index) => (
                  <div
                    key={index}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-bitcoin/40 transition-colors"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-start gap-2 text-bitcoin hover:text-orange-300 transition-colors group"
                    >
                      <BsLink45Deg className="text-base sm:text-lg shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium break-all group-hover:underline">
                          {link.url}
                        </p>
                        {link.description && (
                          <p className="text-gray-400 text-[11px] sm:text-xs mt-1 leading-relaxed">
                            {link.description}
                          </p>
                        )}
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Timestamp */}
          <div className="text-center pt-2 border-t border-white/10">
            <p className="text-gray-500 text-[10px] sm:text-xs">
              Submitted on {new Date(interest.createdAt).toLocaleDateString()} at{" "}
              {new Date(interest.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuilderInfoCard;
