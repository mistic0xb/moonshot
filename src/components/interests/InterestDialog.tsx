import { useState } from "react";
import { BsGithub, BsPlus, BsX } from "react-icons/bs";
import { nip19 } from "nostr-tools";
import type { ProofOfWorkLink } from "../../types/types";
import { useAuth } from "../../context/AuthContext";

interface InterestDialogProps {
  moonshotEventId: string;
  onSubmit: (
    message: string, 
    github?: string, 
    proofOfWorkLinks?: ProofOfWorkLink[]
  ) => void;
  onClose: () => void;
}

export function InterestDialog({ 
  // moonshotEventId, 
  onSubmit, 
  onClose 
}: InterestDialogProps) {
  const [message, setMessage] = useState("");
  const [github, setGithub] = useState("");
  const [proofLinks, setProofLinks] = useState<ProofOfWorkLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkDesc, setNewLinkDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const { userPubkey } = useAuth();
  const userNpub = userPubkey ? nip19.npubEncode(userPubkey) : "Not logged in";

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) {
      alert("Please enter a URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(newLinkUrl);
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    if (proofLinks.length >= 10) {
      alert("Maximum 10 proof-of-work links allowed");
      return;
    }

    setProofLinks([
      ...proofLinks,
      { url: newLinkUrl, description: newLinkDesc }
    ]);

    setNewLinkUrl("");
    setNewLinkDesc("");
  };

  const handleRemoveLink = (index: number) => {
    setProofLinks(proofLinks.filter((_, i) => i !== index));
  };

  const formatGitHubUrl = (url: string): string => {
    // Remove any protocol and www, extract username
    const cleaned = url.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '');
    const username = cleaned.split('/')[0];
    return username;
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    if (message.length < 10) {
      alert("Please write a more detailed message (at least 10 characters)");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(
        message, 
        github ? formatGitHubUrl(github) : undefined, 
        proofLinks.length > 0 ? proofLinks : undefined
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newLinkUrl.trim()) {
      handleAddLink();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* <div className="card-style max-w-2xl w-full p-8 relative my-8"> */}
        <div className="card-style max-w-2xl w-full p-8 relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold disabled:opacity-50"
        >
          ×
        </button>

        <h2 className="text-3xl font-bold text-white mb-2">Show Your Interest</h2>
        <p className="text-gray-400 mb-6">Tell the creator why you're the right builder for this project</p>

        <div className="space-y-6">
          {/* Nostr Pubkey */}
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              Your Nostr Identity
            </label>
            <input
              type="text"
              value={userNpub}
              disabled
              className="w-full bg-sky-900/20 border border-sky-500/30 text-gray-400 px-4 py-3 rounded font-mono text-sm"
            />
            <p className="text-gray-500 text-xs mt-1">This will be visible to the project creator</p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              Your Pitch *
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell them about your experience, why you're interested, and what you can bring to the project..."
              rows={5}
              className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors rounded resize-vertical"
            />
            <p className="text-gray-500 text-xs mt-1">
              {message.length}/500 characters • Minimum 10 characters
            </p>
          </div>

          {/* GitHub (Optional) */}
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              GitHub Username (Optional)
            </label>
            <div className="flex items-center gap-2 bg-blackish border border-sky-500/30 px-4 py-3 rounded">
              <BsGithub className="text-gray-400 text-xl" />
              <input
                type="text"
                value={github}
                onChange={e => setGithub(e.target.value)}
                placeholder="username (we'll extract it from URL if provided)"
                className="flex-1 bg-transparent text-white focus:outline-none"
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              You can paste full GitHub URL or just your username
            </p>
          </div>

          {/* Proof of Work Links */}
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              Proof of Work (Optional)
            </label>
            <p className="text-gray-400 text-sm mb-3">
              Showcase your previous work, projects, or contributions (max 10 links)
            </p>
            
            {/* Add Link Form */}
            <div className="space-y-2 mb-4">
              <input
                type="url"
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="https://github.com/yourname/your-project"
                className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-2 focus:border-sky-400 focus:outline-none transition-colors rounded"
              />
              <input
                type="text"
                value={newLinkDesc}
                onChange={e => setNewLinkDesc(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Brief description of this work..."
                className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-2 focus:border-sky-400 focus:outline-none transition-colors rounded"
              />
              <button
                onClick={handleAddLink}
                disabled={proofLinks.length >= 10 || !newLinkUrl.trim()}
                className="w-full bg-sky-700 hover:bg-sky-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <BsPlus className="text-xl" />
                Add Link ({proofLinks.length}/10)
              </button>
            </div>

            {/* Display Added Links */}
            {proofLinks.length > 0 && (
              <div className="space-y-2">
                <p className="text-gray-400 text-sm font-medium">Added links:</p>
                {proofLinks.map((link, index) => (
                  <div 
                    key={index}
                    className="bg-sky-900/20 border border-sky-500/30 p-3 rounded flex items-start justify-between gap-2 group"
                  >
                    <div className="flex-1 min-w-0">
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sky-300 hover:text-sky-200 text-sm break-all underline"
                      >
                        {link.url}
                      </a>
                      {link.description && (
                        <p className="text-gray-400 text-xs mt-1">{link.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveLink(index)}
                      disabled={submitting}
                      className="text-red-400 hover:text-red-300 transition-colors shrink-0 opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    >
                      <BsX className="text-2xl" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !message.trim() || message.length < 10}
            className="w-full bg-sky-200 hover:bg-sky-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-4 text-lg uppercase tracking-wide transition-all duration-300 cursor-pointer rounded flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Interest"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterestDialog;