import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import RichTextEditor from "../components/RichTextEditor";
import { fetchAllMoonshots , publishMoonshot } from "../utils/nostr";

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

  // Check auth on mount and after auth changes
  useEffect(() => {
    checkAuth();
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = "Project title is required";
    }

    if (!content.trim()) {
      newErrors.content = "Project description is required";
    }

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
    if (!validateForm()) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Launch login dialog
      document.dispatchEvent(new CustomEvent("nlLaunch", { detail: "login" }));

      // Wait for authentication, then retry
      const handleAuth = (e: any) => {
        if (e.detail.type === "login" || e.detail.type === "signup") {
          document.removeEventListener("nlAuth", handleAuth);
          // Retry submission after successful login
          setTimeout(() => handleSubmit(), 500);
        }
      };
      document.addEventListener("nlAuth", handleAuth);
      return;
    }

    // TODO: Show payment modal for 1k sats
    // After payment, publish moonshot event
    const moonshotId = await publishMoonshot(title, content, budget, timeline, selectedTags);
    const allMoonshots = await fetchAllMoonshots();
    console.log(allMoonshots);
    navigate(`/moonshot/${moonshotId}`);
  };

  const formatBudget = (value: string) => {
    return parseInt(value).toLocaleString() + " sats";
  };

  return (
    <div className="min-h-screen bg-blackish py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-white mb-2 text-center">
          Create Your <span className="text-sky-400">Moonshot</span>
        </h1>
        <p className="text-gray-400 text-center mb-12">
          Share your ambitious project idea with the Nostr builder community
        </p>

        <div className="card-style p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sky-300 font-semibold mb-2 text-sm uppercase tracking-wide">
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errors.title) setErrors({...errors, title: ""});
              }}
              placeholder="e.g., Zapit: live board messaging powered by nostr & lightning"
              className={`w-full bg-blackish border ${
                errors.title ? "border-red-500" : "border-sky-500/30"
              } text-white px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors rounded`}
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Budget & Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Budget */}
            <div>
              <label className="block text-gray-300/90 font-semibold mb-2 text-sm uppercase tracking-wide">
                Budget (sats) *
              </label>

              {!showCustomBudget ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sky-300 font-medium">{formatBudget(budget)}</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomBudget(true)}
                      className="text-sky-400 hover:text-sky-300 text-sm underline"
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
                      if (errors.budget) setErrors({...errors, budget: ""});
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />

                  <div className="flex justify-between text-xs text-gray-400">
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
                      if (errors.budget) setErrors({...errors, budget: ""});
                    }}
                    min="1000"
                    max="1000000"
                    placeholder="Enter custom amount"
                    className={`flex-1 bg-blackish border ${
                      errors.budget ? "border-red-500" : "border-sky-500/30"
                    } text-white px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors rounded`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomBudget(false)}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    Back
                  </button>
                </div>
              )}
              {errors.budget && <p className="text-red-400 text-sm mt-1">{errors.budget}</p>}
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-gray-300/90 font-semibold mb-2 text-sm uppercase tracking-wide">
                Timeline (months) *
              </label>

              {!showCustomTimeline ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sky-300 font-medium">
                      {timeline} month{timeline !== "1" ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomTimeline(true)}
                      className="text-sky-400 hover:text-sky-300 text-sm underline"
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
                      if (errors.timeline) setErrors({...errors, timeline: ""});
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />

                  <div className="flex justify-between text-xs text-gray-400">
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
                      if (errors.timeline) setErrors({...errors, timeline: ""});
                    }}
                    min="1"
                    max="36"
                    placeholder="Months"
                    className={`flex-1 bg-blackish border ${
                      errors.timeline ? "border-red-500" : "border-sky-500/30"
                    } text-white px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors rounded`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomTimeline(false)}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    Back
                  </button>
                </div>
              )}
              {errors.timeline && <p className="text-red-400 text-sm mt-1">{errors.timeline}</p>}
            </div>
          </div>

          {/* Topic Tags */}
          <div>
            <label className="block text-sky-300 font-semibold mb-2 text-sm uppercase tracking-wide">
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
              ].map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`px-3 py-2 rounded-full border transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-sky-500 border-sky-500 text-white"
                      : "bg-blackish border-sky-500/30 text-sky-300 hover:bg-sky-500/20"
                  }`}
                  onClick={() => {
                    const newTags = selectedTags.includes(tag)
                      ? selectedTags.filter(t => t !== tag)
                      : [...selectedTags, tag];
                    setSelectedTags(newTags);
                    if (errors.tags && newTags.length >= 2) setErrors({...errors, tags: ""});
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
            {errors.tags && <p className="text-red-400 text-sm mt-1">{errors.tags}</p>}
            <p className="text-gray-400 text-sm mt-2">Select at least 2 tags to categorize your project</p>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-sky-300 font-semibold mb-2 text-sm uppercase tracking-wide">
              Project Description *
            </label>
            <RichTextEditor content={content} onChange={setContent} />
            {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content}</p>}
          </div>

          {/* Info Box */}
          <div className="card-style border-sky-500/30 p-4 bg-sky-900/10 rounded">
            <p className="text-sky-300 text-sm">
              <strong>Note:</strong> Publishing a moonshot requires a 1,000 sat payment via
              Lightning. This helps prevent spam and ensures serious project submissions.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-sky-200 hover:bg-sky-300 text-black font-bold py-4 text-lg uppercase tracking-wide transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] cursor-pointer rounded"
          >
            {isAuthenticated ? "Publish Moonshot" : "Login to Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateMoonshot;