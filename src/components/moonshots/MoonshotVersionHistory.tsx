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
      const next = new Set(prev);
      next.has(versionId) ? next.delete(versionId) : next.add(versionId);
      return next;
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
      <div className="mt-5 rounded-2xl border border-white/10 bg-card/70 px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
        <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-bitcoin animate-spin" />
        <span>Loading edit history…</span>
      </div>
    );
  }

  if (versions.length === 0) return null;

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-card/70 px-3.5 py-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left text-xs hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5">
            <BsClock className="text-bitcoin text-sm" />
          </span>
          <span className="font-semibold text-gray-200">
            Previous Edited Versions ({versions.length})
          </span>
        </div>
        {isExpanded ? (
          <BsChevronUp className="text-gray-400" />
        ) : (
          <BsChevronDown className="text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {versions.map((version, index) => {
            const open = expandedVersions.has(version.id);
            return (
              <div
                key={version.id}
                className="rounded-xl border border-white/10 bg-black/30 overflow-hidden text-xs"
              >
                <button
                  onClick={() => toggleVersion(version.id)}
                  className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="mb-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
                      <span className="font-medium">Version {versions.length - index}</span>
                      <span>•</span>
                      <span>{formatDate(version.createdAt)}</span>
                    </div>
                    <h4 className="line-clamp-1 text-[13px] font-semibold text-gray-100">
                      {version.title}
                    </h4>
                  </div>
                  {open ? (
                    <BsChevronUp className="ml-2 text-gray-400" />
                  ) : (
                    <BsChevronDown className="ml-2 text-gray-400" />
                  )}
                </button>

                {open && (
                  <div className="border-t border-white/10 px-3 py-3 space-y-3">
                    {version.topics && version.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {version.topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-200"
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-2">
                        <p className="mb-0.5 text-[10px] text-gray-500">Budget</p>
                        <p className="text-[12px] font-semibold text-bitcoin">
                          {version.budget} sats
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-2">
                        <p className="mb-0.5 text-[10px] text-gray-500">Status</p>
                        <p
                          className={`text-[12px] font-semibold ${
                            version.status === "open"
                              ? "text-green-400"
                              : version.status === "assigned"
                              ? "text-yellow-300"
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

                    <div className="prose prose-invert prose-sm max-w-none">
                      <RichTextViewer content={version.content} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MoonshotVersionHistory;
