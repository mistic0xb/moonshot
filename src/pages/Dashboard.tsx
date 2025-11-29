import { useState, useEffect } from "react";
import BuilderInfoCard from "../components/BuilderInfoCard";
import type { Moonshot, Interest } from "../types/types";
import { fetchAllMoonshots } from "../utils/nostr";

function Dashboard() {
  const [moonshot, setMoonshot] = useState<Moonshot[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedBuilder, setSelectedBuilder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch user's moonshots and interests from Nostr
    const fetchData = async () => {
      // TODO: Fetch user's moonshots and interests from Nostr
      const allMoonshots = await fetchAllMoonshots();
      setMoonshot(allMoonshots);
    };
    fetchData();

    setTimeout(() => {
      setInterests([
        {
          id: "interest-1",
          moonshotId: "moonshot-1",
          builderPubkey: "npub1builder123abc456def789ghi...",
          message:
            "I have 5+ years of experience building React applications and have contributed to several Nostr clients including Damus and Amethyst. I can deliver this project on time with high quality, well-documented code. My GitHub shows my track record of successful open-source projects.",
          github: "https://github.com/builder123",
          createdAt: Date.now(),
        },
        {
          id: "interest-2",
          moonshotId: "moonshot-1",
          builderPubkey: "npub1developer456def789ghi012jkl...",
          message:
            "Experienced full-stack developer specializing in decentralized protocols. Previously built 3 successful Nostr apps with over 10k users combined. I understand the technical challenges and have solutions ready.",
          createdAt: Date.now(),
        },
        {
          id: "interest-3",
          moonshotId: "moonshot-1",
          builderPubkey: "npub1coder789ghi012jkl345mno...",
          message:
            "Hello! I'm a senior developer with expertise in React, TypeScript, and Nostr protocol. I've been active in the Nostr community for 2+ years and would love to help bring your vision to life.",
          github: "https://github.com/nostr-builder",
          createdAt: Date.now(),
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const handleAccept = async (interestId: string, builderPubkey: string) => {
    // TODO: Send NIP-17 DM to builder
    // TODO: Send rejection message to other builders
    console.log("Accepting builder:", builderPubkey);
    setSelectedBuilder(interestId);

    // Simulate sending DM
    setTimeout(() => {
      alert("Private message sent to builder via Nostr!");
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blackish flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-sky-600/20 border-t-sky-600 animate-spin"></div>
          <p className="text-sky-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blackish py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-white mb-12">
          Your <span className="text-sky-400">Dashboard</span>
        </h1>

        {moonshot.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">You haven't created any moonshots yet</p>
            <button
              onClick={() => (window.location.href = "/create")}
              className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-3 font-semibold uppercase transition-colors"
            >
              Create Your First Moonshot
            </button>
          </div>
        ) : (
          moonshot.map(moonshot => (
            <div key={moonshot.id} className="mb-12">
              <div className="card-style p-6 mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{moonshot.title}</h2>
                <div className="flex gap-4 text-sm flex-wrap">
                  <span className="text-sky-400">{moonshot.budget} sats</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">{moonshot.timeline}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">{moonshot.interests} interested builders</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-4">Interested Builders</h3>

              {interests.filter(i => i.moonshotId === moonshot.id).length === 0 ? (
                <div className="card-style p-8 text-center">
                  <p className="text-gray-400">No builders have shown interest yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {interests
                    .filter(i => i.moonshotId === moonshot.id)
                    .map(interest => (
                      <BuilderInfoCard
                        key={interest.id}
                        interest={interest}
                        onAccept={() => handleAccept(interest.id, interest.builderPubkey)}
                        isAccepted={selectedBuilder === interest.id}
                      />
                    ))}
                </div>
              )}

              {selectedBuilder && (
                <div className="card-style p-6 mt-6 border-green-500/30 bg-green-900/10">
                  <p className="text-green-400 font-semibold">
                    ✓ Builder accepted! A private message has been sent via Nostr. Other interested
                    builders have been notified.
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
