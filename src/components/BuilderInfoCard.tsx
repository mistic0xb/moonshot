import { BsGithub, BsLink45Deg, BsChat, BsCheck2Circle } from "react-icons/bs";
import { nip19 } from "nostr-tools";
import type { Interest } from "../types/types";

interface BuilderInfoCardProps {
  interest: Interest;
  onChat: () => void;
  onAccept: () => void;
  isAccepted?: boolean;
}

function BuilderInfoCard({ interest, onChat, onAccept, isAccepted }: BuilderInfoCardProps) {
  const builderNpub = nip19.npubEncode(interest.builderPubkey);

  return (
    <div className="card-style p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {/* Builder Npub */}
          <p className="text-sky-400 font-mono text-sm mb-2">
            {builderNpub.slice(0, 16)}...{builderNpub.slice(-8)}
          </p>

          {/* GitHub Link */}
          {interest.github && (
            <a
              href={interest.github.startsWith('http') ? interest.github : `https://${interest.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-sky-400 text-sm mb-2 transition-colors"
            >
              <BsGithub />
              <span>GitHub Profile</span>
            </a>
          )}

          {/* Proof of Work Links */}
          {interest.proofOfWorkLinks && interest.proofOfWorkLinks.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-gray-500 text-xs font-semibold uppercase">Proof of Work:</p>
              {interest.proofOfWorkLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-sky-400 hover:text-sky-300 text-sm transition-colors group"
                >
                  <BsLink45Deg className="text-lg shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate group-hover:underline">{link.url}</p>
                    {link.description && (
                      <p className="text-gray-500 text-xs">{link.description}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 shrink-0 ml-4">
          {!isAccepted ? (
            <>
              <button
                onClick={onChat}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold uppercase text-sm transition-colors flex items-center gap-2"
              >
                <BsChat />
                Chat
              </button>
              <button
                onClick={onAccept}
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded font-semibold uppercase text-sm transition-colors flex items-center gap-2"
              >
                <BsCheck2Circle />
                Accept
              </button>
            </>
          ) : (
            <div className="bg-green-600/20 border border-green-500/30 text-green-400 px-6 py-2 rounded font-semibold uppercase text-sm flex items-center gap-2">
              <BsCheck2Circle />
              Accepted
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="mt-4 p-4 bg-blackish border border-sky-500/20 rounded">
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
          {interest.message}
        </p>
      </div>

      {/* Timestamp */}
      <p className="text-gray-500 text-xs mt-3">
        Submitted {new Date(interest.createdAt).toLocaleDateString()} at{" "}
        {new Date(interest.createdAt).toLocaleTimeString()}
      </p>
    </div>
  );
}

export default BuilderInfoCard;