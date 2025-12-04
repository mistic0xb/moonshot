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
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">
          Moonshots You're <span className="text-sky-400">Interested In</span>
        </h2>
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-sky-600/20 border-t-sky-600 animate-spin"></div>
          <p className="text-sky-400">Loading interested moonshots...</p>
        </div>
      </div>
    );
  }

  if (moonshotsWithInterests.length === 0) {
    return (
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">
          Moonshots You're <span className="text-sky-400">Interested In</span>
        </h2>
        <div className="card-style p-12 text-center">
          <p className="text-gray-400 text-lg mb-4">
            You haven't shown interest in any moonshots yet
          </p>
          <button
            onClick={() => (window.location.href = "/discover")}
            className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-3 font-semibold uppercase transition-colors rounded"
          >
            Discover Moonshots
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-white mb-8">
        Moonshots You're <span className="text-sky-400">Interested In</span>
      </h2>

      <div className="space-y-4">
        {moonshotsWithInterests.map(({ moonshot, interest }) => {
          const isExpanded = expandedId === interest.id;

          return (
            <div
              key={interest.id}
              className={`card-style transition-all duration-300 ${
                isExpanded ? "border-sky-400/50 bg-sky-900/10" : ""
              }`}
            >
              {/* Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleExpand(interest.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{moonshot.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{moonshot.budget}</span>
                      <span>•</span>
                      <span>{moonshot.timeline}</span>
                      <span>•</span>
                      <span>Applied {new Date(interest.createdAt).toLocaleDateString()}</span>
                    </div>
                    {moonshot.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {moonshot.topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-sky-900/30 text-sky-300 text-xs rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedInterest(interest);
                      }}
                      className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded font-semibold uppercase text-sm transition-colors flex items-center gap-2"
                    >
                      <BsChat />
                      Chat
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleExpand(interest.id);
                      }}
                      className="text-gray-400 hover:text-sky-400 transition-colors p-2"
                    >
                      {isExpanded ? <BsChevronUp size={20} /> : <BsChevronDown size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-6 border-t border-sky-500/20 pt-6 animate-in fade-in duration-300">
                  {/* Moonshot Description */}
                  <div>
                    <h4 className="text-sky-300 font-semibold text-sm mb-2 uppercase tracking-wide">
                      Project Description
                    </h4>
                    <div className="bg-blackish border border-sky-500/20 rounded p-4">
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {moonshot.content}
                      </p>
                    </div>
                  </div>

                  {/* Your Application */}
                  <div>
                    <h4 className="text-sky-300 font-semibold text-sm mb-2 uppercase tracking-wide">
                      Your Application
                    </h4>
                    <div className="bg-blackish border border-sky-500/20 rounded p-4">
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {interest.message}
                      </p>
                    </div>
                  </div>

                  {/* GitHub Link */}
                  {interest.github && (
                    <div>
                      <h4 className="text-sky-300 font-semibold text-sm mb-2 uppercase tracking-wide">
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
                        className="text-sky-400 hover:text-sky-300 text-sm underline"
                      >
                        {interest.github}
                      </a>
                    </div>
                  )}

                  {/* Proof of Work */}
                  {interest.proofOfWorkLinks.length > 0 && (
                    <div>
                      <h4 className="text-sky-300 font-semibold text-sm mb-3 uppercase tracking-wide">
                        Proof of Work ({interest.proofOfWorkLinks.length})
                      </h4>
                      <div className="space-y-2">
                        {interest.proofOfWorkLinks.map((link, idx) => (
                          <div
                            key={idx}
                            className="bg-sky-900/10 border border-sky-500/20 rounded p-3"
                          >
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-400 hover:text-sky-300 text-sm break-all"
                            >
                              {link.url}
                            </a>
                            {link.description && (
                              <p className="text-gray-400 text-sm mt-1">{link.description}</p>
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

      {/* Chat Modal */}
      {selectedInterest && (
        <BuilderChatBox
          interest={selectedInterest}
          onClose={() => setSelectedInterest(null)}
        />
      )}
    </div>
  );
}

export default InterestedMoonshotsSection;