import { useState } from "react";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { publishComment } from "../../utils/nostr";

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
      alert("Failed to post comment. Please try again.");
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
    <div className="bg-sky-900/10 border border-sky-500/30 rounded-lg p-4">
      {/* Comment Textarea */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className="w-full bg-blackish border border-sky-500/30 rounded px-3 py-2 text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:border-sky-500 resize-none"
      />

      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>
          {content.length}/{maxLength}
        </span>
      </div>

      {/* Chip-In Section */}
      <div className="mt-4 border-t border-sky-500/20 pt-4">
        <button
          onClick={() => setShowChipIn(!showChipIn)}
          className="flex items-center gap-2 text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors mb-3"
        >
          <BsCurrencyBitcoin className="text-base" />
          {displayAmount > 0
            ? `Chipping in ${displayAmount.toLocaleString()} sats`
            : "Add Chip-In (Optional)"}
        </button>

        {showChipIn && (
          <div className="space-y-3">
            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {CHIP_IN_PRESETS.map(amount => (
                <button
                  key={amount}
                  onClick={() => handlePresetClick(amount)}
                  className={`px-3 py-2 rounded text-xs font-semibold transition-colors ${
                    chipIn === amount && !useCustom
                      ? "bg-amber-500 text-black"
                      : "bg-sky-900/20 border border-sky-500/30 text-sky-300 hover:bg-sky-900/30"
                  }`}
                >
                  {amount >= 1000 ? `${amount / 1000}k` : amount}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div>
              <label className="block text-gray-400 text-xs mb-1">Custom Amount</label>
              <input
                type="text"
                value={customAmount}
                onChange={e => handleCustomInput(e.target.value)}
                placeholder="Enter custom amount"
                className={`w-full bg-blackish border rounded px-3 py-2 text-gray-200 text-sm placeholder-gray-500 focus:outline-none ${
                  useCustom
                    ? "border-amber-500 focus:border-amber-400"
                    : "border-sky-500/30 focus:border-sky-500"
                }`}
              />
            </div>

            {/* Info Text */}
            <p className="text-gray-500 text-xs">
              Show your support by indicating how much you're willing to contribute to this
              moonshot.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Posting..." : parentCommentId ? "Reply" : "Comment"}
        </button>
      </div>
    </div>
  );
}

export default CommentInput;
