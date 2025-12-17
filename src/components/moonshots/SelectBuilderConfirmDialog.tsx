import type { Interest } from "../../types/types";

interface SelectBuilderConfirmDialogProps {
  builder: Interest;
  onConfirm: () => void;
  onCancel: () => void;
}

function SelectBuilderConfirmDialog({
  builder,
  onConfirm,
  onCancel,
}: SelectBuilderConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-white">Confirm Builder Selection</h2>

        <div className="mb-6 rounded-xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-3">
            <img
              src={builder.moonshotId || "/default-avatar.png"}
              alt={builder.builderPubkey || "Builder"}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium text-white">
                {builder.builderPubkey || "Anonymous Builder"}
              </p>
              <p className="text-xs text-gray-400">{builder.builderPubkey?.slice(0, 16)}...</p>
            </div>
          </div>
        </div>

        <p className="mb-6 text-sm text-gray-300">
          Are you sure you want to select this builder for your moonshot project?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-bitcoin px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-bitcoin/90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectBuilderConfirmDialog;
