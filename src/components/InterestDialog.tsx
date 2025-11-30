import { useState } from "react";
import { BsGithub, BsPlus, BsX } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";
import { nip19 } from "nostr-tools";
import type { ProofOfWorkLink } from "../types/types";

interface InterestDialogProps {
  moonshotId: string;
  moonshotEventId: string;
  creatorPubkey: string;
  onSubmit: (
    message: string, 
    github?: string, 
    proofOfWorkLinks?: ProofOfWorkLink[]
  ) => void;
  onClose: () => void;
}

export function InterestDialog({ 
  moonshotId, 
  moonshotEventId, 
  creatorPubkey, 
  onSubmit, 
  onClose 
}: InterestDialogProps) {
  const [message, setMessage] = useState("");
  const [github, setGithub] = useState("");
  const [proofLinks, setProofLinks] = useState<ProofOfWorkLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkDesc, setNewLinkDesc] = useState("");
  
  const { userPubkey } = useAuth();
  const userNpub = userPubkey ? nip19.npubEncode(userPubkey) : "Not logged in";

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) {
      alert("Please enter a URL");
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

  const handleSubmit = () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    onSubmit(
      message, 
      github || undefined, 
      proofLinks.length > 0 ? proofLinks : undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card-style max-w-2xl w-full p-8 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold"
        >
          ×
        </button>

        <h2 className="text-3xl font-bold text-white mb-6">Show Your Interest</h2>

        <div className="space-y-6">
          {/* Nostr Pubkey */}
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              Your Nostr Pubkey
            </label>
            <input
              type="text"
              value={userNpub}
              disabled
              className="w-full bg-sky-900/20 border border-sky-500/30 text-gray-400 px-4 py-3 rounded font-mono text-sm"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              Message to Creator *
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell them why you're the right builder for this project..."
              rows={4}
              className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors rounded"
            />
          </div>

          {/* GitHub (Optional) */}
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              GitHub Profile (Optional)
            </label>
            <div className="flex items-center gap-2 bg-blackish border border-sky-500/30 px-4 py-3 rounded">
              <BsGithub className="text-gray-400 text-xl" />
              <input
                type="text"
                value={github}
                onChange={e => setGithub(e.target.value)}
                placeholder="github.com/username"
                className="flex-1 bg-transparent text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Proof of Work Links */}
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              Proof of Work (Optional - Max 10 links)
            </label>
            
            {/* Add Link Form */}
            <div className="space-y-2 mb-4">
              <input
                type="url"
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                placeholder="https://example.com/my-project"
                className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-2 focus:border-sky-400 focus:outline-none transition-colors rounded"
              />
              <input
                type="text"
                value={newLinkDesc}
                onChange={e => setNewLinkDesc(e.target.value)}
                placeholder="Description (e.g., 'Nostr relay I built')"
                className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-2 focus:border-sky-400 focus:outline-none transition-colors rounded"
              />
              <button
                onClick={handleAddLink}
                disabled={proofLinks.length >= 10}
                className="w-full bg-sky-700 hover:bg-sky-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <BsPlus className="text-xl" />
                Add Link ({proofLinks.length}/10)
              </button>
            </div>

            {/* Display Added Links */}
            {proofLinks.length > 0 && (
              <div className="space-y-2">
                {proofLinks.map((link, index) => (
                  <div 
                    key={index}
                    className="bg-sky-900/20 border border-sky-500/30 p-3 rounded flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sky-300 hover:text-sky-200 text-sm break-all"
                      >
                        {link.url}
                      </a>
                      {link.description && (
                        <p className="text-gray-400 text-xs mt-1">{link.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveLink(index)}
                      className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
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
            className="w-full bg-sky-200 hover:bg-sky-300 text-black font-bold py-4 text-lg uppercase tracking-wide transition-all duration-300 cursor-pointer rounded"
          >
            Submit Interest
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterestDialog;