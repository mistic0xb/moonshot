import { useState, useEffect } from "react";
import { BsChevronDown, BsChevronUp, BsChat } from "react-icons/bs";
import type { Interest, Moonshot } from "../../types/types";
import { fetchMoonshotById } from "../../utils/nostr";
import BuilderChatBox from "../builder/BuilderChatBox";

interface InterestedMoonshotsSectionProps {
  interests: Interest[];
  loading: boolean;
}

interface MoonshotWithInterest {
  moonshot: Moonshot;
  interest: Interest;
}

function InterestedMoonshotsSection({ interests, loading }: InterestedMoonshotsSectionProps) {
  const [moonshotsWithInterests, setMoonshotsWithInterests] = useState<MoonshotWithInterest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null);
  const [loadingMoonshots, setLoadingMoonshots] = useState(true);

  useEffect(() => {
    const loadMoonshots = async () => {
      if (interests.length === 0) {
        setLoadingMoonshots(false);
        return;
      }

      const moonshotsData: MoonshotWithInterest[] = [];

      for (const interest of interests) {
        try {
          const moonshot = await fetchMoonshotById(interest.moonshotId);
          if (moonshot) {
            moonshotsData.push({ moonshot, interest });
          }
        } catch (error) {
          console.error(`Failed to load moonshot ${interest.moonshotId}:`, error);
        }
      }

      setMoonshotsWithInterests(moonshotsData);
      setLoadingMoonshots(false);
    };

    loadMoonshots();
  }, [interests]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading || loadingMoonshots) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          Moonshots You&apos;re Interested In
        </h2>
        <div className="py-10 text-center">
          <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-white/20 border-t-nostr animate-spin" />
          <p className="text-xs text-gray-400">Loading interested moonshots…</p>
        </div>
      </section>
    );
  }

  if (moonshotsWithInterests.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          Moonshots You&apos;re Interested In
        </h2>
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/40 px-6 py-10 text-center">
          <p className="mb-3 text-sm text-gray-300">
            You haven&apos;t shown interest in any moonshots yet.
          </p>
          <button
            onClick={() => (window.location.href = "/explore")}
            className="inline-flex items-center justify-center rounded-full bg-nostr px-6 py-2 text-xs sm:text-sm font-semibold uppercase tracking-wide text-white hover:bg-purple-500 transition-colors"
          >
            Discover Moonshots
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-semibold text-white">
        Moonshots You&apos;re Interested In
      </h2>

      <div className="space-y-3">
        {moonshotsWithInterests.map(({ moonshot, interest }) => {
          const isExpanded = expandedId === interest.id;

          return (
            <div
              key={interest.id}
              className={`rounded-2xl border border-white/10 bg-card/70 transition-all duration-300 ${
                isExpanded ? "border-bitcoin/60 bg-card/90" : ""
              }`}
            >
              {/* Header */}
              <div
                className="flex cursor-pointer items-start justify-between gap-4 px-4 py-4 sm:px-5 sm:py-4"
                onClick={() => toggleExpand(interest.id)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="mb-1 text-sm sm:text-base font-semibold text-white line-clamp-1">
                    {moonshot.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                    <span>{moonshot.budget} sats</span>
                    <span>•</span>
                    <span>{moonshot.timeline} months</span>
                    <span>•</span>
                    <span>Applied {new Date(interest.createdAt).toLocaleDateString()}</span>
                  </div>
                  {moonshot.topics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {moonshot.topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-gray-200"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedInterest(interest);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-bitcoin px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-black hover:bg-orange-400 transition-colors"
                  >
                    <BsChat className="text-xs" />
                    Chat
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleExpand(interest.id);
                    }}
                    className="rounded-full p-1.5 text-gray-400 hover:text-bitcoin transition-colors"
                  >
                    {isExpanded ? <BsChevronUp size={16} /> : <BsChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 space-y-4">
                  <div>
                    <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Project Description
                    </h4>
                    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
                      <p className="text-xs text-gray-200 whitespace-pre-wrap">
                        {moonshot.content}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Your Application
                    </h4>
                    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
                      <p className="text-xs text-gray-200 whitespace-pre-wrap">
                        {interest.message}
                      </p>
                    </div>
                  </div>

                  {interest.github && (
                    <div>
                      <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        GitHub
                      </h4>
                      <a
                        href={
                          interest.github.startsWith("http")
                            ? interest.github
                            : `https://github.com/${interest.github}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-bitcoin underline hover:text-orange-300"
                      >
                        {interest.github}
                      </a>
                    </div>
                  )}

                  {interest.proofOfWorkLinks.length > 0 && (
                    <div>
                      <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        Proof of Work ({interest.proofOfWorkLinks.length})
                      </h4>
                      <div className="space-y-2">
                        {interest.proofOfWorkLinks.map((link, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2"
                          >
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-xs text-bitcoin hover:text-orange-300"
                            >
                              {link.url}
                            </a>
                            {link.description && (
                              <p className="mt-1 text-[11px] text-gray-400">{link.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedInterest && (
        <BuilderChatBox interest={selectedInterest} onClose={() => setSelectedInterest(null)} />
      )}
    </section>
  );
}

export default InterestedMoonshotsSection;
