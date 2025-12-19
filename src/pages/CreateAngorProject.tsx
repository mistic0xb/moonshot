import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { BsArrowLeft, BsInfoCircle } from "react-icons/bs";
import type {
  Moonshot,
  AngorProjectExport,
  FundPattern,
  Monthly,
  Weekly,
  UserProfile,
} from "../types/types";
import { publishAngorProject } from "../utils/nostr/publish";
import { useToast } from "../context/ToastContext";

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function CreateAngorProject() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { moonshot, selectedBuilder } =
    (location.state as {
      moonshot: Moonshot;
      selectedBuilder: UserProfile;
    }) || {};

  const [patternType, setPatternType] = useState<"monthly" | "weekly">("monthly");
  const [monthlyDuration, setMonthlyDuration] = useState<3 | 6 | 9>(3);
  const [monthlyDay, setMonthlyDay] = useState<number>(1);
  const [weeklyDuration, setWeeklyDuration] = useState<4 | 8 | 12>(4);
  const [weeklyDay, setWeeklyDay] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [exportedEventId, setExportedEventId] = useState<string | null>(null);

  if (!moonshot || !selectedBuilder) {
    return (
      <div className="min-h-screen bg-dark pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/10 bg-card/80 px-6 py-8 text-center">
            <p className="text-gray-300 mb-4">No moonshot or builder selected.</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 rounded-lg bg-bitcoin px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-bitcoin/90"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleExportToAngor = async () => {
    try {
      setIsExporting(true);

      let fundingPattern: FundPattern;

      if (patternType === "monthly") {
        fundingPattern = {
          type: "monthly",
          duration: monthlyDuration,
          releaseDay: monthlyDay,
        } as Monthly;
      } else {
        fundingPattern = {
          type: "weekly",
          duration: weeklyDuration,
          releaseDay: weeklyDay,
        } as Weekly;
      }

      const projectData: AngorProjectExport = {
        moonshot: moonshot,
        projectType: "fund",
        selectedBuilderPubkey: selectedBuilder.pubkey,
        penaltyThreshold: "1000000", // 1M sats
        fundingPattern: fundingPattern,
      };

      const eventId = await publishAngorProject(projectData);
      console.log("ANGOR EXPORT: ", eventId);
      showToast("Project exported to Angor successfully!", "success");
      setExportedEventId(eventId);
    } catch (error) {
      console.error("Failed to export project:", error);
      showToast("Failed to export project. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition-colors"
        >
          <BsArrowLeft className="text-sm" />
          <span>Back</span>
        </button>

        <div className="mb-6 rounded-2xl border border-white/10 bg-card/80 px-6 py-5">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create Angor Project</h1>
            <p className="text-sm text-gray-400">
              Export your moonshot to Angor with the selected builder
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Project Profile */}
            <div className="rounded-2xl border border-white/10 bg-card/80 px-6 py-5">
              <h5 className="mb-4 text-lg font-semibold text-white">Project Profile</h5>

              <div className="space-y-4">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={moonshot.title}
                    disabled
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                  />
                  <small className="text-xs text-gray-500 mt-1 block">
                    {moonshot.title.length}/200 characters
                  </small>
                </div>

                {/* About */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">About</label>
                  <textarea
                    value={moonshot.content}
                    disabled
                    rows={4}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed resize-none"
                  />
                  <small className="text-xs text-gray-500 mt-1 block">
                    {moonshot.content.length}/400 characters
                  </small>
                </div>
              </div>
            </div>

            {/* Funding Pattern */}
            <div className="rounded-2xl border border-white/10 bg-card/80 px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <h5 className="text-lg font-semibold text-white">Funding Pattern</h5>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <BsInfoCircle size={16} />
                  </button>
                  {showTooltip && (
                    <div className="absolute left-6 top-0 z-10 w-64 rounded-lg border border-white/10 bg-card p-3 shadow-xl">
                      <p className="text-xs text-gray-300">
                        Choose how often funds will be released to the builder - either on a monthly
                        or weekly schedule.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pattern Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Pattern Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPatternType("monthly")}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      patternType === "monthly"
                        ? "border-bitcoin bg-bitcoin/10 text-bitcoin"
                        : "border-white/10 bg-black/40 text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setPatternType("weekly")}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      patternType === "weekly"
                        ? "border-bitcoin bg-bitcoin/10 text-bitcoin"
                        : "border-white/10 bg-black/40 text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>

              {/* Monthly Options */}
              {patternType === "monthly" && (
                <div className="space-y-4 rounded-xl border border-white/10 bg-black/40 p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Duration (Months)
                    </label>
                    <select
                      value={monthlyDuration}
                      onChange={e => setMonthlyDuration(parseInt(e.target.value) as 3 | 6 | 9)}
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-bitcoin focus:outline-none focus:ring-1 focus:ring-bitcoin"
                    >
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={9}>9 Months</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Release Day of Month (1-27)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={27}
                      value={monthlyDay}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        if (val >= 1 && val <= 27) setMonthlyDay(val);
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-bitcoin focus:outline-none focus:ring-1 focus:ring-bitcoin"
                    />
                    <small className="text-xs text-gray-500 mt-1 block">
                      Funds will be released on day {monthlyDay} of each month
                    </small>
                  </div>
                </div>
              )}

              {/* Weekly Options */}
              {patternType === "weekly" && (
                <div className="space-y-4 rounded-xl border border-white/10 bg-black/40 p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Duration (Weeks)
                    </label>
                    <select
                      value={weeklyDuration}
                      onChange={e => setWeeklyDuration(parseInt(e.target.value) as 4 | 8 | 12)}
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-bitcoin focus:outline-none focus:ring-1 focus:ring-bitcoin"
                    >
                      <option value={4}>4 Weeks</option>
                      <option value={8}>8 Weeks</option>
                      <option value={12}>12 Weeks</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Release Day of Week
                    </label>
                    <select
                      value={weeklyDay}
                      onChange={e =>
                        setWeeklyDay(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 | 7)
                      }
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-bitcoin focus:outline-none focus:ring-1 focus:ring-bitcoin"
                    >
                      {WEEKDAY_NAMES.map((day, index) => (
                        <option key={index} value={index + 1}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <small className="text-xs text-gray-500 mt-1 block">
                      Funds will be released every {WEEKDAY_NAMES[weeklyDay - 1]}
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-card/80 p-6 lg:sticky lg:top-28">
              <h5 className="text-lg font-semibold text-white mb-4">Preview</h5>

              {/* Moonshot Info */}
              <div className="mb-4 rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-gray-500 mb-1">Moonshot</p>
                <p className="text-sm font-medium text-white mb-2">{moonshot.title}</p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  <span>
                    Budget: <span className="text-bitcoin">{moonshot.budget} sats</span>
                  </span>
                </div>
              </div>

              {/* Builder Info */}
              <div className="mb-4 rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-gray-500 mb-2">Selected Builder</p>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedBuilder.picture || "src/assets/default-avatar.jpg"}
                    alt={selectedBuilder.name || "Builder"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {selectedBuilder.name || "Anonymous Builder"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {selectedBuilder.pubkey?.slice(0, 16)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Amount */}
              <div className="mb-4 rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-gray-500 mb-1">Target Amount</p>
                <p className="text-lg font-bold text-bitcoin">{moonshot.budget} sats</p>
              </div>

              {/* Penalty Threshold */}
              <div className="mb-4 rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-gray-500 mb-1">Penalty Threshold</p>
                <p className="text-lg font-bold text-red-400">1,000,000 sats</p>
                <small className="text-xs text-gray-500 mt-1 block">
                  Default penalty for early withdrawal
                </small>
              </div>

              {/* Funding Pattern Summary */}
              <div className="mb-6 rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-gray-500 mb-2">Funding Pattern</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Type</span>
                    <span className="text-sm font-semibold text-white capitalize">
                      {patternType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Duration</span>
                    <span className="text-sm font-semibold text-white">
                      {patternType === "monthly"
                        ? `${monthlyDuration} Months`
                        : `${weeklyDuration} Weeks`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Release Day</span>
                    <span className="text-sm font-semibold text-white">
                      {patternType === "monthly"
                        ? `Day ${monthlyDay}`
                        : WEEKDAY_NAMES[weeklyDay - 1]}
                    </span>
                  </div>
                </div>
              </div>

              {/* EventId */}
              {exportedEventId && (
                <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                  <p className="text-sm font-semibold text-green-400 mb-2">
                    Angor project exported successfully
                  </p>
                  <p className="text-xs text-gray-300 mb-2">
                    Import your project on Angor by pasting this Event ID in the
                    <span className="font-medium text-white"> Create Project </span>
                    section.
                  </p>
                  <code className="block w-full break-all rounded-lg bg-black/60 p-2 text-xs text-green-300">
                    {exportedEventId}
                  </code>
                </div>
              )}

              {/* Export Button */}
              <button
                onClick={handleExportToAngor}
                disabled={isExporting || !!exportedEventId}
                className="w-full rounded-lg bg-bitcoin px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-bitcoin/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    Exporting...
                  </span>
                ) : exportedEventId ? (
                  "Exported"
                ) : (
                  "Export To Angor"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateAngorProject;
