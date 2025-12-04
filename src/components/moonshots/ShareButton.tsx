import { useState } from "react";
import type { Moonshot } from "../../types/types";
import { publishNostrShare } from "../../utils/nostr";
import { BsLink, BsShare, BsX } from "react-icons/bs";

interface ShareButtonProps {
  moonshot: Moonshot;
}

function ShareButton({ moonshot }: ShareButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      alert("Failed to copy link");
    }
  };

  const handleShareOnNostr = async () => {
    try {
      setSharing(true);
      await publishNostrShare(moonshot, window.location.href);
      alert("Shared on Nostr successfully!");
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to share on Nostr:", error);
      alert("Failed to share on Nostr. Please try again.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-4 py-2 bg-sky-900/20 hover:bg-sky-900/30 border border-sky-500/30 text-sky-300 rounded transition-colors"
        title="Share Moonshot"
      >
        <BsShare size={18} />
        <span className="font-medium">Share</span>
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowDialog(false)}
          ></div>

          {/* Dialog */}
          <div className="relative bg-linear-to-br from-gray-900 to-gray-950 border border-sky-500/30 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <BsX size={24} />
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-6">Share Moonshot</h2>

            {/* Share Options */}
            <div className="space-y-4">
              {/* Share via Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-4 p-4 bg-sky-900/20 hover:bg-sky-900/30 border border-sky-500/30 rounded-lg transition-all group"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-sky-500/20 rounded-full group-hover:bg-sky-500/30 transition-colors">
                  <BsLink size={24} className="text-sky-300" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold">Share via Link</p>
                  <p className="text-gray-400 text-sm">
                    {copied ? "Copied to clipboard!" : "Copy link to clipboard"}
                  </p>
                </div>
                {copied && (
                  <span className="text-green-400 text-sm font-medium">✓ Copied</span>
                )}
              </button>

              {/* Share on Nostr */}
              <button
                onClick={handleShareOnNostr}
                disabled={sharing}
                className="w-full flex items-center gap-4 p-4 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-500/30 rounded-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors">
                  <BsShare size={24} className="text-purple-300" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold">Share on Nostr</p>
                  <p className="text-gray-400 text-sm">
                    {sharing ? "Publishing..." : "Post to your Nostr feed"}
                  </p>
                </div>
                {sharing && (
                  <div className="w-5 h-5 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                )}
              </button>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <p className="text-gray-400 text-xs mb-2">Preview:</p>
              <p className="text-white font-semibold">{moonshot.title}</p>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-sky-300">{moonshot.budget} sats</span>
                <span className="text-gray-500">•</span>
                <span className="text-sky-300">{moonshot.timeline} months</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ShareButton;