import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import RichTextEditor from "../components/richtext/RichTextEditor";
import { fetchAllMoonshots, publishMoonshot } from "../utils/nostr";

function CreateMoonshot() {
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAuth();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("50000");
  const [timeline, setTimeline] = useState("3");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCustomBudget, setShowCustomBudget] = useState(false);
  const [showCustomTimeline, setShowCustomTimeline] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = "Project title is required";
    if (!content.trim()) newErrors.content = "Project description is required";

    if (!budget.trim()) {
      newErrors.budget = "Budget is required";
    } else if (parseInt(budget) < 1000) {
      newErrors.budget = "Minimum budget is 1,000 sats";
    }

    if (!timeline.trim()) {
      newErrors.timeline = "Timeline is required";
    } else if (parseInt(timeline) < 1) {
      newErrors.timeline = "Minimum timeline is 1 month";
    }

    if (selectedTags.length < 2) {
      newErrors.tags = "Please select at least 2 tags";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!isAuthenticated) {
      document.dispatchEvent(new CustomEvent("nlLaunch", { detail: "login" }));

      const handleAuth = (e: any) => {
        if (e.detail.type === "login" || e.detail.type === "signup") {
          document.removeEventListener("nlAuth", handleAuth);
          setTimeout(() => handleSubmit(), 500);
        }
      };
      document.addEventListener("nlAuth", handleAuth);
      return;
    }

    const moonshotId = await publishMoonshot(title, content, budget, timeline, selectedTags);
    const allMoonshots = await fetchAllMoonshots();
    console.log(allMoonshots);
    navigate(`/moonshot/${moonshotId}`);
  };

  const formatBudget = (value: string) => parseInt(value).toLocaleString() + " sats";

  return (
    <div className="min-h-screen bg-dark pt-28 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
            Create Your <span className="gradient-text">Moonshot</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
            Share your ambitious project idea with the Nostr builder community.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/10 bg-card/80 p-5 sm:p-7 space-y-7 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: "" });
              }}
              placeholder="e.g., Zapit: live board messaging powered by Nostr & Lightning"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 bg-black/40 focus:outline-none focus:border-bitcoin ${
                errors.title ? "border-red-500" : "border-white/10"
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
          </div>

          {/* Budget & timeline */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Budget */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">
                Budget (sats) *
              </label>

              {!showCustomBudget ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-bitcoin">{formatBudget(budget)}</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomBudget(true)}
                      className="text-gray-400 hover:text-gray-200 underline"
                    >
                      Custom
                    </button>
                  </div>

                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={budget}
                    onChange={e => {
                      setBudget(e.target.value);
                      if (errors.budget) setErrors({ ...errors, budget: "" });
                    }}
                    className="w-full h-2 rounded-full bg-black/40 accent-bitcoin slider"
                  />

                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>1K</span>
                    <span>25K</span>
                    <span>50K</span>
                    <span>75K</span>
                    <span>100K</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={budget}
                    onChange={e => {
                      setBudget(e.target.value);
                      if (errors.budget) setErrors({ ...errors, budget: "" });
                    }}
                    min="1000"
                    max="1000000"
                    placeholder="Enter custom amount"
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm text-gray-100 bg-black/40 placeholder:text-gray-500 focus:outline-none focus:border-bitcoin ${
                      errors.budget ? "border-red-500" : "border-white/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomBudget(false)}
                    className="rounded-xl bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-200 hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                </div>
              )}
              {errors.budget && <p className="mt-1 text-xs text-red-400">{errors.budget}</p>}
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">
                Timeline (months) *
              </label>

              {!showCustomTimeline ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-200">
                      {timeline} month{timeline !== "1" ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomTimeline(true)}
                      className="text-gray-400 hover:text-gray-200 underline"
                    >
                      Custom
                    </button>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={timeline}
                    onChange={e => {
                      setTimeline(e.target.value);
                      if (errors.timeline) setErrors({ ...errors, timeline: "" });
                    }}
                    className="w-full h-2 rounded-full bg-black/40 accent-nostr slider"
                  />

                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>1M</span>
                    <span>3M</span>
                    <span>6M</span>
                    <span>9M</span>
                    <span>12M</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={timeline}
                    onChange={e => {
                      setTimeline(e.target.value);
                      if (errors.timeline) setErrors({ ...errors, timeline: "" });
                    }}
                    min="1"
                    max="36"
                    placeholder="Months"
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm text-gray-100 bg-black/40 placeholder:text-gray-500 focus:outline-none focus:border-nostr ${
                      errors.timeline ? "border-red-500" : "border-white/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomTimeline(false)}
                    className="rounded-xl bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-200 hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                </div>
              )}
              {errors.timeline && <p className="mt-1 text-xs text-red-400">{errors.timeline}</p>}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">
              Tags *
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "nostr",
                "lightning",
                "web",
                "mobile",
                "react",
                "bitcoin",
                "typescript",
                "design",
                "ai",
                "zaps",
                "relays",
                "lnurl",
              ].map(tag => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-bitcoin text-black shadow-[0_0_8px_rgba(247,147,26,0.5)]"
                        : "border border-white/15 bg-white/5 text-gray-200 hover:border-bitcoin/60 hover:text-bitcoin"
                    }`}
                    onClick={() => {
                      const newTags = active
                        ? selectedTags.filter(t => t !== tag)
                        : [...selectedTags, tag];
                      setSelectedTags(newTags);
                      if (errors.tags && newTags.length >= 2) setErrors({ ...errors, tags: "" });
                    }}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
            {errors.tags && <p className="mt-1 text-xs text-red-400">{errors.tags}</p>}
            <p className="mt-2 text-xs text-gray-500">
              Select at least 2 tags to categorize your project.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">
              Project Description *
            </label>
            <RichTextEditor content={content} onChange={setContent} />
            {errors.content && <p className="mt-1 text-xs text-red-400">{errors.content}</p>}
          </div>

          {/* Info box */}
          <div className="rounded-xl border border-white/15 bg-black/40 p-4">
            <p className="text-xs sm:text-sm text-gray-200">
              <span className="font-semibold text-bitcoin">Note:</span> Publishing a moonshot
              requires a 1,000 sat payment via Lightning. This helps prevent spam and ensures
              serious project submissions.
            </p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full rounded-full bg-bitcoin py-3 text-sm sm:text-base font-semibold uppercase tracking-wide text-black transition-all hover:bg-orange-400 hover:shadow-[0_0_30px_rgba(247,147,26,0.5)]"
          >
            {isAuthenticated ? "Publish Moonshot" : "Login to Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateMoonshot;
