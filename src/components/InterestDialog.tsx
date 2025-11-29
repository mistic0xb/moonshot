// ============================================
// FILE: src/components/InterestDialog.tsx
// ============================================

import { useState } from "react";
import { BsGithub } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";
import { nip19 } from "nostr-tools";

interface InterestDialogProps {
  onSubmit: (message: string, github?: string) => void;
  onClose: () => void;
}

function InterestDialog({ onSubmit, onClose }: InterestDialogProps) {
  const [message, setMessage] = useState("");
  const [github, setGithub] = useState("");
  const { userPubkey } = useAuth();
  const userNpub = nip19.npubEncode(userPubkey!)

  const handleSubmit = () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }
    onSubmit(message, github || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="card-style max-w-2xl w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold"
        >
          ×
        </button>

        <h2 className="text-3xl font-bold text-white mb-6">Show Your Interest</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              Your Nostr Pubkey
            </label>
            <input
              type="text"
              value={`${userNpub}`}
              disabled
              className="w-full bg-sky-900/20 border border-sky-500/30 text-gray-400 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              Message to Creator *
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell them why you're the right builder for this project..."
              rows={4}
              className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              GitHub Profile (Optional)
            </label>
            <div className="flex items-center gap-2 bg-blackish border border-sky-500/30 px-4 py-3">
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

          <button
            onClick={handleSubmit}
            className="w-full bg-sky-200 hover:bg-sky-300 text-black font-bold py-4 text-lg uppercase tracking-wide transition-all duration-300 cursor-pointer"
          >
            Submit Interest
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterestDialog;
