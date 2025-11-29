import { useState } from 'react';
import { BiUpvote } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';

interface UpvoteButtonProps {
  initialCount: number;
  onUpvote: () => Promise<void>;
}

function UpvoteButton({ initialCount, onUpvote }: UpvoteButtonProps) {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpvote = async () => {
    if (hasUpvoted || loading) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Launch login dialog
      document.dispatchEvent(new CustomEvent('nlLaunch', { detail: 'login' }));
      return;
    }

    setLoading(true);
    try {
      await onUpvote();
      setHasUpvoted(true);
      setCount(count + 1);
    } catch (error) {
      console.error('Failed to upvote:', error);
      alert('Failed to upvote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpvote}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 border transition-all rounded ${
        hasUpvoted 
          ? 'bg-sky-600 border-sky-600 text-white' 
          : 'border-sky-500/50 text-sky-400 hover:border-sky-400'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <BiUpvote className="text-xl" />
      <span>{count}</span>
    </button>
  );
}

export default UpvoteButton;