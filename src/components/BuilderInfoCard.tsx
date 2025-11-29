// ============================================
// FILE: src/components/BuilderInfoCard.tsx
// ============================================

import { BsGithub, BsCheck2Circle } from 'react-icons/bs';
import type { Interest } from '../types/types';

interface BuilderInfoCardProps {
  interest: Interest;
  onAccept: () => void;
  isAccepted?: boolean;
}

function BuilderInfoCard({ interest, onAccept, isAccepted }: BuilderInfoCardProps) {
  return (
    <div className="card-style p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <p className="text-sky-200 font-mono text-sm mb-2">
            {interest.builderPubkey.substring(0, 16)}...
          </p>
          {interest.github && (
            <a 
              href={interest.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-sky-400 text-sm transition-colors"
            >
              <BsGithub />
              <span>GitHub Profile</span>
            </a>
          )}
        </div>
        {!isAccepted ? (
          <button
            onClick={onAccept}
            className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2 font-semibold uppercase text-sm transition-colors flex items-center gap-2"
          >
            <BsCheck2Circle />
            Accept
          </button>
        ) : (
          <div className="bg-green-600/20 border border-green-500/30 text-green-400 px-6 py-2 font-semibold uppercase text-sm flex items-center gap-2">
            <BsCheck2Circle />
            Accepted
          </div>
        )}
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">
        {interest.message}
      </p>
    </div>
  );
}

export default BuilderInfoCard;