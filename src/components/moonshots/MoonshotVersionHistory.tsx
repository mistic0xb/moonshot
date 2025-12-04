import { useState } from "react";
import { BsChevronDown, BsChevronUp, BsClock } from "react-icons/bs";
import type { Moonshot } from "../../types/types";
import RichTextViewer from "../richtext/RichTextViewer";

interface MoonshotVersionHistoryProps {
  versions: Moonshot[];
  loading: boolean;
}

function MoonshotVersionHistory({ versions, loading }: MoonshotVersionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const toggleVersion = (versionId: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="card-style p-4 mt-6">
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-4 h-4 rounded-full border-2 border-sky-600/20 border-t-sky-500 animate-spin"></div>
          <span className="text-sm">Loading edit history...</span>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="card-style p-4 mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left hover:bg-sky-900/10 p-2 rounded transition-colors"
      >
        <div className="flex items-center gap-2">
          <BsClock className="text-sky-400" />
          <span className="text-sky-300 font-semibold">
            Previous Edited Versions ({versions.length})
          </span>
        </div>
        {isExpanded ? (
          <BsChevronUp className="text-sky-400" />
        ) : (
          <BsChevronDown className="text-sky-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {versions.map((version, index) => (
            <div key={version.id} className="border border-sky-500/20 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleVersion(version.id)}
                className="flex items-center justify-between w-full p-4 hover:bg-sky-900/10 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-400 text-sm font-medium">
                      Version {versions.length - index}
                    </span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="text-gray-500 text-xs">{formatDate(version.createdAt)}</span>
                  </div>
                  <h4 className="text-sky-300 font-semibold">{version.title}</h4>
                </div>
                {expandedVersions.has(version.id) ? (
                  <BsChevronUp className="text-gray-400 ml-2" />
                ) : (
                  <BsChevronDown className="text-gray-400 ml-2" />
                )}
              </button>

              {expandedVersions.has(version.id) && (
                <div className="p-4 pt-0 border-t border-sky-500/10">
                  {/* Topics */}
                  {version.topics && version.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {version.topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-sky-900/20 border border-sky-500/30 text-sky-300 text-xs rounded-full"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-blackish border border-sky-500/20 p-3 rounded">
                      <p className="text-gray-500 text-xs mb-1">Budget</p>
                      <p className="text-sky-300 text-sm font-semibold">{version.budget} sats</p>
                    </div>
                    <div className="bg-blackish border border-sky-500/20 p-3 rounded">
                      <p className="text-gray-500 text-xs mb-1">Timeline</p>
                      <p className="text-sky-300 text-sm font-semibold">
                        {version.timeline} months
                      </p>
                    </div>
                    <div className="bg-blackish border border-sky-500/20 p-3 rounded">
                      <p className="text-gray-500 text-xs mb-1">Status</p>
                      <p
                        className={`text-sm font-semibold ${
                          version.status === "open"
                            ? "text-green-400"
                            : version.status === "assigned"
                            ? "text-yellow-400"
                            : version.status === "in-progress"
                            ? "text-blue-400"
                            : version.status === "completed"
                            ? "text-purple-400"
                            : "text-gray-400"
                        }`}
                      >
                        {version.status}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="prose prose-invert prose-sm max-w-none">
                    <RichTextViewer content={version.content} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MoonshotVersionHistory;
