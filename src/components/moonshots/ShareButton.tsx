import { useState } from "react";
import type { Moonshot } from "../../types/types";
import { publishNostrShare } from "../../utils/nostr";
import { BsLink, BsShare, BsX } from "react-icons/bs";
import { useToast } from "../../context/ToastContext";

interface ShareButtonProps {
  moonshot: Moonshot;
}

function ShareButton({ moonshot }: ShareButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { showToast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      showToast("Failed to copy link", "error");
    }
  };

  const handleShareOnNostr = async () => {
    try {
      setSharing(true);
      await publishNostrShare(moonshot, window.location.href);
      showToast("Shared on Nostr successfully!", "success");
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to share on Nostr:", error);
      showToast("Failed to share on Nostr. Please try again.", "error");
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 hover:border-bitcoin/60 hover:text-bitcoin hover:bg-black/40 transition-all cursor-pointer"
        title="Share Moonshot"
      >
        <BsShare className="text-sm" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowDialog(false)}
            aria-label="Close share dialog backdrop"
          />

          {/* Dialog */}
          <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl border border-white/10 bg-linear-to-br from-dark to-card/95 p-5 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            {/* Close Button */}
            <button
              onClick={() => setShowDialog(false)}
              className="absolute right-4 top-4 rounded-full bg-white/5 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <BsX size={18} />
            </button>

            {/* Title */}
            <h2 className="mb-2 text-xl sm:text-2xl font-bold text-white">Share Moonshot</h2>
            <p className="mb-5 text-xs text-gray-500">
              Spread this idea with your network or post it directly to Nostr.
            </p>

            {/* Share Options */}
            <div className="space-y-3">
              {/* Share via Link */}
              <button
                onClick={handleCopyLink}
                className="group flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/3 p-3.5 sm:p-4 text-left transition-all hover:border-bitcoin/50 hover:bg-white/6 cursor-pointer"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 group-hover:bg-bitcoin/20 transition-colors">
                  <BsLink size={20} className="text-bitcoin" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Share via Link</p>
                  <p className="text-xs text-gray-400">
                    {copied ? "Copied to clipboard!" : "Copy link to clipboard"}
                  </p>
                </div>
                {copied && <span className="text-xs font-semibold text-green-400">✓ Copied</span>}
              </button>

              {/* Share on Nostr */}
              <button
                onClick={handleShareOnNostr}
                disabled={sharing}
                className="group flex w-full items-center gap-4 rounded-xl border border-nostr/40 bg-nostr/10 p-3.5 sm:p-4 text-left transition-all hover:border-nostr hover:bg-nostr/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-nostr/30 group-hover:bg-nostr/50 transition-colors">
                  <BsShare size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Share on Nostr</p>
                  <p className="text-xs text-gray-300">
                    {sharing ? "Publishing..." : "Post to your Nostr feed"}
                  </p>
                </div>
                {sharing && (
                  <div className="h-4 w-4 rounded-full border-2 border-nostr/30 border-t-nostr animate-spin" />
                )}
              </button>
            </div>

            {/* Preview */}
            <div className="mt-5 rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Preview</p>
              <p className="text-sm font-semibold text-white line-clamp-2">{moonshot.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-bitcoin">
                  {moonshot.budget} sats
                </span>
                <span className="text-gray-600">•</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ShareButton;
