import { useState } from "react";
import { BsPlus } from "react-icons/bs";
import type { Moonshot } from "../../types/types";
import { useToast } from "../../context/ToastContext";

interface EditMoonshotDialogProps {
  moonshot: Moonshot;
  onSubmit: (data: {
    title: string;
    content: string;
    budget: string;
    timeline: string;
    topics: string[];
    status: string;
  }) => void;
  onClose: () => void;
}

export function EditMoonshotDialog({ moonshot, onSubmit, onClose }: EditMoonshotDialogProps) {
  const [title, setTitle] = useState(moonshot.title);
  const [content, setContent] = useState(moonshot.content);
  const [budget, setBudget] = useState(moonshot.budget);
  const [timeline, setTimeline] = useState(moonshot.timeline);
  const [topics, setTopics] = useState<string[]>(moonshot.topics || []);
  const [status, setStatus] = useState(moonshot.status);
  const [newTopic, setNewTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleAddTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !budget.trim() || !timeline.trim()) {
      showToast("Please fill in all required fields", "info");
      return;
    }

    setSubmitting(true);

    try {
      onSubmit({
        title,
        content,
        budget,
        timeline,
        topics,
        status,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTopic.trim()) {
      handleAddTopic();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <div className="relative my-8 w-full max-w-xl rounded-2xl border border-white/10 bg-linear-to-br from-dark via-card to-card/95 p-5 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-full bg-white/5 px-2 py-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
        >
          ×
        </button>

        <h2 className="mb-1 text-xl sm:text-2xl font-bold text-white">Edit Moonshot</h2>
        <p className="mb-5 text-xs text-gray-400">Update your project details and status.</p>

        <div className="space-y-5 text-sm">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-300">
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter project title"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-bitcoin"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-300">
              Project Description *
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe your project in detail…"
              rows={5}
              className="w-full resize-vertical rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-bitcoin"
            />
          </div>

          {/* Budget / timeline / status */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-300">
                Budget (sats) *
              </label>
              <input
                type="text"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="50000"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-bitcoin"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-300">
                Timeline (months) *
              </label>
              <input
                type="text"
                value={timeline}
                onChange={e => setTimeline(e.target.value)}
                placeholder="3"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-bitcoin"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-300">
                Status *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-bitcoin"
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Topics */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-300">
              Topics
            </label>
            <div className="mb-2 flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={e => setNewTopic(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a topic (e.g., nostr, lightning)"
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-bitcoin"
              />
              <button
                onClick={handleAddTopic}
                className="inline-flex items-center gap-1.5 rounded-full bg-bitcoin px-3.5 py-2 text-xs font-semibold text-black hover:bg-orange-400 transition-colors cursor-pointer"
              >
                <BsPlus className="text-sm" />
                Add
              </button>
            </div>

            {topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topics.map((topic, index) => (
                  <div
                    key={index}
                    onClick={() => handleRemoveTopic(index)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-gray-200 cursor-pointer hover:border-red-400/70 hover:bg-red-500/10 transition-colors"
                  >
                    <span className="font-medium">#{topic}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              !title.trim() ||
              !content.trim() ||
              !budget.trim() ||
              !timeline.trim() ||
              !status.trim()
            }
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-bitcoin px-4 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-wide text-black transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-200 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                Updating…
              </>
            ) : (
              "Update Moonshot"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditMoonshotDialog;
