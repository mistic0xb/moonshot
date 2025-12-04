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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onCancel}
      ></div>

      {/* Dialog */}
      <div className="relative bg-linear-to-br from-gray-900 to-gray-950 border border-red-500/30 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Close Button */}
        {!isDeleting && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <BsX size={24} />
          </button>
        )}

        {/* Warning Icon */}
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-500/20 rounded-full">
          <FiAlertTriangle size={32} className="text-red-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Remove Moonshot?
        </h2>

        {/* Message */}
        <p className="text-gray-300 text-center mb-2">
          Are you sure you want to delete
        </p>
        <p className="text-sky-300 font-semibold text-center mb-6">
          "{moonshotTitle}"
        </p>

        <div className="bg-red-900/20 border border-red-500/30 rounded p-3 mb-6">
          <p className="text-red-200 text-sm text-center">
            This will hide the moonshot from public view. This action cannot be undone.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Deleting...
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