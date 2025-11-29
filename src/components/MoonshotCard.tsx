import { BiUpvote } from 'react-icons/bi';
import { FiHeart } from 'react-icons/fi';
import type { Moonshot } from '../types/types';

interface MoonshotCardProps {
  moonshot: Moonshot;
  onClick: () => void;
}

function MoonshotCard({ moonshot, onClick }: MoonshotCardProps) {
  // Strip HTML tags for preview
  const plainText = moonshot.content.replace(/<[^>]*>/g, '');
  const preview = plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;

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
          <div className="flex items-center gap-1 text-sky-300">
            <BiUpvote className="text-lg" />
            <span>{moonshot.upvotes}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <FiHeart className="text-base" />
            <span>{moonshot.interests}</span>
          </div>
        </div>
      </div>
      
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {preview}
      </p>
      
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="px-3 py-1 bg-sky-900/20 border border-sky-500/20">
          {moonshot.budget} sats
        </span>
        <span className="px-3 py-1 bg-sky-900/20 border border-sky-500/20">
          {moonshot.timeline}
        </span>
      </div>
    </div>
  );
}

export default MoonshotCard;