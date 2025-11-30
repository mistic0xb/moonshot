import { useState, useEffect } from "react";
import { BsGithub, BsLink45Deg, BsChat, BsCheck2Circle, BsChevronDown, BsChevronUp } from "react-icons/bs";
import { nip19 } from "nostr-tools";
import type { Interest } from "../types/types";
import { fetchUserProfile } from "../utils/nostr";

interface BuilderInfoCardProps {
  interest: Interest;
  onChat: () => void;
  onAccept: () => void;
  isAccepted?: boolean;
}

interface UserProfile {
  pubkey: string;
  name?: string;
  picture?: string;
  about?: string;
}

function BuilderInfoCard({ interest, onChat, onAccept, isAccepted }: BuilderInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
      className={`card-style p-6 cursor-pointer transition-all duration-300 ${
        isExpanded ? 'border-sky-400/50 bg-sky-900/10' : 'hover:border-sky-300/40'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header - Always Visible */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          {/* Profile Picture */}
          {loadingProfile ? (
            <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse"></div>
          ) : userProfile?.picture ? (
            <img
              src={userProfile.picture}
              alt={displayName}
              className="w-12 h-12 rounded-full border-2 border-sky-500/30 object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-sky-900/50 border-2 border-sky-500/30 flex items-center justify-center">
              <span className="text-sky-300 text-sm font-bold">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          {/* Builder Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-lg truncate">
                {displayName}
              </h3>
              {userProfile?.name && (
                <span className="text-gray-500 text-xs font-mono bg-gray-800 px-2 py-1 rounded">
                  {builderNpub.slice(0, 8)}...{builderNpub.slice(-4)}
                </span>
              )}
            </div>

            {/* GitHub Link */}
            {interest.github && (
              <a
                href={interest.github.startsWith('http') ? interest.github : `https://github.com/${interest.github}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-gray-400 hover:text-sky-400 text-sm transition-colors"
              >
                <BsGithub />
                <span>{interest.github.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')}</span>
              </a>
            )}

            {/* Quick Stats */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{interest.proofOfWorkLinks.length} proof(s)</span>
              <span>•</span>
              <span>{new Date(interest.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Expand Toggle */}
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {!isAccepted ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChat();
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded font-semibold uppercase text-xs transition-colors flex items-center gap-1"
              >
                <BsChat />
                Chat
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 rounded font-semibold uppercase text-xs transition-colors flex items-center gap-1"
              >
                <BsCheck2Circle />
                Accept
              </button>
            </>
          ) : (
            <div className="bg-green-600/20 border border-green-500/30 text-green-400 px-4 py-2 rounded font-semibold uppercase text-xs flex items-center gap-1">
              <BsCheck2Circle />
              Accepted
            </div>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-gray-400 hover:text-sky-400 transition-colors p-1"
          >
            {isExpanded ? <BsChevronUp /> : <BsChevronDown />}
          </button>
        </div>
      </div>

      {/* Message Preview */}
      {!isExpanded && (
        <div className="mt-4">
          <p className="text-gray-400 text-sm line-clamp-2">
            {interest.message}
          </p>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 space-y-6 animate-in fade-in duration-300">
          {/* About Section (if available) */}
          {userProfile?.about && (
            <div>
              <h4 className="text-sky-300 font-semibold text-sm mb-2 uppercase tracking-wide">About</h4>
              <p className="text-gray-300 text-sm leading-relaxed bg-blackish p-4 rounded border border-sky-500/20">
                {userProfile.about}
              </p>
            </div>
          )}

          {/* Message */}
          <div>
            <h4 className="text-sky-300 font-semibold text-sm mb-2 uppercase tracking-wide">Their Pitch</h4>
            <div className="bg-blackish border border-sky-500/20 rounded p-4">
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {interest.message}
              </p>
            </div>
          </div>

          {/* Proof of Work Links */}
          {interest.proofOfWorkLinks.length > 0 && (
            <div>
              <h4 className="text-sky-300 font-semibold text-sm mb-3 uppercase tracking-wide">
                Proof of Work ({interest.proofOfWorkLinks.length})
              </h4>
              <div className="space-y-3">
                {interest.proofOfWorkLinks.map((link, index) => (
                  <div
                    key={index}
                    className="bg-sky-900/10 border border-sky-500/20 rounded p-4 hover:border-sky-400/30 transition-colors"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-start gap-3 text-sky-400 hover:text-sky-300 transition-colors group"
                    >
                      <BsLink45Deg className="text-xl shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-all group-hover:underline">
                          {link.url}
                        </p>
                        {link.description && (
                          <p className="text-gray-400 text-sm mt-1 leading-relaxed">
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
          <div className="text-center">
            <p className="text-gray-500 text-xs">
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