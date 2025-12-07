import { useState } from "react";
import { BsGithub, BsPlus, BsX } from "react-icons/bs";
import { nip19 } from "nostr-tools";
import type { ProofOfWorkLink } from "../../types/types";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

interface InterestDialogProps {
  moonshotEventId: string;
  onSubmit: (message: string, github?: string, proofOfWorkLinks?: ProofOfWorkLink[]) => void;
  onClose: () => void;
}

export function InterestDialog({
  // moonshotEventId,
  onSubmit,
  onClose,
}: InterestDialogProps) {
  const [message, setMessage] = useState("");
  const [github, setGithub] = useState("");
  const [proofLinks, setProofLinks] = useState<ProofOfWorkLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkDesc, setNewLinkDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { userPubkey } = useAuth();
  const userNpub = userPubkey ? nip19.npubEncode(userPubkey) : "Not logged in";
  const { showToast } = useToast();

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) {
      showToast("Please enter a url", "info");
      return;
    }

    try {
      new URL(newLinkUrl);
    } catch {
      showToast("Please enter a vaild URL", "info");
      return;
    }

    if (proofLinks.length >= 10) {
      showToast("Maximum 10 proof-of-work links allowed", "info");
      return;
    }

    setProofLinks([...proofLinks, { url: newLinkUrl, description: newLinkDesc }]);

    setNewLinkUrl("");
    setNewLinkDesc("");
  };

  const handleRemoveLink = (index: number) => {
    setProofLinks(proofLinks.filter((_, i) => i !== index));
  };

  const formatGitHubUrl = (url: string): string => {
    const cleaned = url.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "");
    const username = cleaned.split("/")[0];
    return username;
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      showToast("Please enter a message", "info");
      return;
    }

    if (message.length < 10) {
      showToast("Please write a more detailed message (at least 10 characters)", "info");
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
    if (e.key === "Enter" && newLinkUrl.trim()) {
      handleAddLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-linear-to-br from-dark via-card to-card/95 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.9)]">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-full bg-white/5 p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
        >
          <BsX className="text-lg" />
        </button>

        {/* Header */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Show Your Interest</h2>
        <p className="text-sm text-gray-400 mb-6">
          Tell the creator why you&apos;re the right builder for this project.
        </p>

        <div className="space-y-6">
          {/* Nostr identity */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              Your Nostr Identity
            </label>
            <input
              type="text"
              value={userNpub}
              disabled
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-xs text-gray-400"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              This will be visible to the project creator.
            </p>
          </div>

          {/* Pitch */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              Your Pitch *
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell them about your experience, why you're interested, and what you can bring to the project..."
              rows={4}
              className="w-full resize-vertical rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-bitcoin"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              {message.length}/500 characters • Minimum 10 characters
            </p>
          </div>

          {/* GitHub */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              GitHub Username (optional)
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5">
              <BsGithub className="text-lg text-gray-400" />
              <input
                type="text"
                value={github}
                onChange={e => setGithub(e.target.value)}
                placeholder="username or full GitHub URL"
                className="flex-1 bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Paste your full GitHub URL or just your username.
            </p>
          </div>

          {/* Proof of work */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              Proof of Work (optional)
            </label>
            <p className="mb-3 text-sm text-gray-400">
              Showcase previous work, projects, or contributions (max 10 links).
            </p>

            {/* Add link */}
            <div className="mb-3 space-y-2">
              <input
                type="url"
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="https://github.com/yourname/your-project"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-bitcoin"
              />
              <input
                type="text"
                value={newLinkDesc}
                onChange={e => setNewLinkDesc(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Brief description of this work..."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-bitcoin"
              />
              <button
                onClick={handleAddLink}
                disabled={proofLinks.length >= 10 || !newLinkUrl.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-bitcoin px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-300"
              >
                <BsPlus className="text-lg" />
                Add Link ({proofLinks.length}/10)
              </button>
            </div>

            {/* Links list */}
            {proofLinks.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-300">Added links:</p>
                {proofLinks.map((link, index) => (
                  <div
                    key={index}
                    className="group flex items-start justify-between gap-2 rounded-xl border border-white/10 bg-black/40 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-xs text-bitcoin underline hover:text-orange-300"
                      >
                        {link.url}
                      </a>
                      {link.description && (
                        <p className="mt-1 text-[11px] text-gray-400">{link.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveLink(index)}
                      disabled={submitting}
                      className="shrink-0 text-red-400 opacity-0 transition-opacity hover:text-red-300 group-hover:opacity-100 disabled:opacity-40"
                    >
                      <BsX className="text-lg" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !message.trim() || message.length < 10}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-bitcoin px-4 py-3 text-sm font-semibold uppercase tracking-wide text-black transition-all hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-200"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                Submitting…
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
