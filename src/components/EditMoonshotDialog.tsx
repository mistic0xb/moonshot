import { useState } from "react";
import { BsPlus, BsX } from "react-icons/bs";
import type { Moonshot } from "../types/types";

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
      alert("Please fill in all required fields");
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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card-style max-w-2xl w-full p-8 relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold disabled:opacity-50"
        >
          ×
        </button>

        <h2 className="text-3xl font-bold text-white mb-2">Edit Moonshot</h2>
        <p className="text-gray-400 mb-6">Update your project details</p>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter project title"
              className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors rounded"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              Project Description *
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe your project in detail..."
              rows={8}
              className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors rounded resize-vertical"
            />
          </div>

          {/* Budget & Timeline */}
          {/* Budget & Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
                Budget (sats) *
              </label>
              <input
                type="text"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="50000"
                className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors rounded"
              />
            </div>
            <div>
              <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
                Timeline (months) *
              </label>
              <input
                type="text"
                value={timeline}
                onChange={e => setTimeline(e.target.value)}
                placeholder="3"
                className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors rounded"
              />
            </div>
            <div>
              <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
                Status *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-blackish border border-sky-500/30 text-white px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors rounded"
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          {/* Topics */}
          <div>
            <label className="block text-sky-200 font-semibold mb-2 text-sm uppercase tracking-wide">
              Topics
            </label>
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a topic (e.g., nostr, lightning)"
                  className="flex-1 bg-blackish border border-sky-500/30 text-white px-4 py-2 focus:border-sky-400 focus:outline-none transition-colors rounded"
                />
                <button
                  onClick={handleAddTopic}
                  className="bg-sky-700 hover:bg-sky-600 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                >
                  <BsPlus className="text-xl" />
                  Add
                </button>
              </div>
            </div>

            {/* Display Topics */}
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {topics.map((topic, index) => (
                  <div
                    key={index}
                    className="bg-sky-900/20 border border-sky-500/30 px-3 py-1 rounded-full flex items-center gap-2 group"
                  >
                    <span className="text-sky-300 text-sm">#{topic}</span>
                    <button
                      onClick={() => handleRemoveTopic(index)}
                      className="text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <BsX className="text-lg" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
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
            className="w-full bg-sky-200 hover:bg-sky-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-4 text-lg uppercase tracking-wide transition-all duration-300 cursor-pointer rounded flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Updating...
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
