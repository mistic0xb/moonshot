import { BsX } from "react-icons/bs";
import { FiAlertTriangle } from "react-icons/fi";

interface DeleteConfirmationDialogProps {
  moonshotTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmationDialog({
  moonshotTitle,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl border border-red-500/40 bg-linear-to-br from-dark via-card to-card/95 p-5 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.9)]">
        {/* Close Button */}
        {!isDeleting && (
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 rounded-full bg-white/5 p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <BsX size={16} />
          </button>
        )}

        {/* Warning Icon */}
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
          <FiAlertTriangle size={26} className="text-red-400" />
        </div>

        {/* Title */}
        <h2 className="mb-1 text-center text-lg font-semibold text-white">Remove Moonshot?</h2>

        {/* Message */}
        <p className="text-center text-xs text-gray-400">Are you sure you want to delete</p>
        <p className="mb-4 text-center text-sm font-semibold text-bitcoin line-clamp-2">
          “{moonshotTitle}”
        </p>

        <div className="mb-5 rounded-xl border border-red-500/40 bg-red-900/20 px-3 py-2">
          <p className="text-center text-[11px] text-red-200">
            This will hide the moonshot from public view. This action cannot be undone.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 text-xs sm:text-sm">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 font-semibold text-gray-200 hover:border-white/30 hover:bg-white/10 transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-3 py-2 font-semibold text-white hover:bg-red-400 transition-colors disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationDialog;
