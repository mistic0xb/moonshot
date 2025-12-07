import { useState } from "react";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { publishComment } from "../../utils/nostr";
import { useToast } from "../../context/ToastContext";

interface CommentInputProps {
  moonshotId: string;
  moonshotCreatorPubkey: string;
  parentCommentId?: string;
  parentAuthorPubkey?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

const CHIP_IN_PRESETS = [1000, 2000, 4000, 8000, 16000, 32000, 64000, 100000];

function CommentInput({
  moonshotId,
  moonshotCreatorPubkey,
  parentCommentId,
  parentAuthorPubkey,
  onSuccess,
  onCancel,
  placeholder = "Add a comment...",
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [chipIn, setChipIn] = useState(0);
  const [showChipIn, setShowChipIn] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxLength = 1000;

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    const { showToast } = useToast();

    try {
      setIsSubmitting(true);

      const finalChipIn = useCustom && customAmount ? parseInt(customAmount) : chipIn;

      await publishComment(
        moonshotId,
        moonshotCreatorPubkey,
        content,
        finalChipIn,
        parentCommentId,
        parentAuthorPubkey
      );

      setContent("");
      setChipIn(0);
      setShowChipIn(false);
      setCustomAmount("");
      setUseCustom(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to publish comment:", error);
      showToast("Failed to post comment. Please try again", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresetClick = (amount: number) => {
    setChipIn(amount);
    setUseCustom(false);
  };

  const handleCustomInput = (value: string) => {
    const numValue = value.replace(/\D/g, "");
    setCustomAmount(numValue);
    if (numValue) {
      setUseCustom(true);
      setChipIn(0);
    }
  };

  const displayAmount = useCustom && customAmount ? parseInt(customAmount) : chipIn;

  return (
    <div className="rounded-2xl border border-white/10 bg-card/70 p-4 sm:p-5">
      {/* Comment Textarea */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-bitcoin focus:ring-0"
      />

      <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
        <span>
          {content.length}/{maxLength}
        </span>
        {displayAmount > 0 && (
          <span className="rounded-full bg-bitcoin/10 px-2 py-0.5 text-bitcoin">
            {displayAmount.toLocaleString()} sats
          </span>
        )}
      </div>

      {/* Chip-In Section */}
      <div className="mt-3 border-t border-white/10 pt-3">
        <button
          onClick={() => setShowChipIn(!showChipIn)}
          className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-bitcoin hover:text-orange-300 transition-colors cursor-pointer"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bitcoin/15">
            <BsCurrencyBitcoin className="text-[13px]" />
          </span>
          {displayAmount > 0
            ? `Chipping in ${displayAmount.toLocaleString()} sats`
            : "Add Chip-In (optional)"}
        </button>

        {showChipIn && (
          <div className="space-y-3">
            {/* Presets */}
            <div className="grid grid-cols-4 gap-2">
              {CHIP_IN_PRESETS.map(amount => (
                <button
                  key={amount}
                  onClick={() => handlePresetClick(amount)}
                  className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                    chipIn === amount && !useCustom
                      ? "bg-bitcoin text-black shadow-[0_0_18px_rgba(247,147,26,0.5)]"
                      : "border border-white/10 bg-white/5 text-gray-200 hover:border-bitcoin/60 hover:text-bitcoin"
                  }`}
                >
                  {amount >= 1000 ? `${amount / 1000}k` : amount}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div>
              <label className="mb-1 block text-[11px] text-gray-400">Custom amount (sats)</label>
              <input
                type="text"
                value={customAmount}
                onChange={e => handleCustomInput(e.target.value)}
                placeholder="Enter custom amount"
                className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none ${
                  useCustom
                    ? "border-bitcoin focus:border-orange-300"
                    : "border-white/10 focus:border-bitcoin"
                } bg-black/40`}
              />
            </div>

            <p className="text-[11px] text-gray-500">
              Show your support by indicating how much you&apos;re willing to contribute to this
              moonshot.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-200 hover:border-white/30 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="flex-1 rounded-full bg-bitcoin px-4 py-2 text-xs font-semibold text-black hover:bg-orange-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none cursor-pointer"
        >
          {isSubmitting ? "Posting..." : parentCommentId ? "Reply" : "Comment"}
        </button>
      </div>
    </div>
  );
}

export default CommentInput;
