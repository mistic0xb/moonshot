import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import CreatorMoonshotsSection from "../components/moonshots/CreatorMoonshotsSection";
import InterestedMoonshotsSection from "../components/moonshots/InterestedMoonshotsSection";
import type { Moonshot, Interest } from "../types/types";
import { fetchAllMoonshotsByCreator, fetchUserInterests } from "../utils/nostr";
import { useExportedMoonshots } from "../context/ExportedMoonshotContext";

function Dashboard() {
  const { userPubkey } = useAuth();
  const [myMoonshots, setMyMoonshots] = useState<Moonshot[]>([]);
  const [myInterests, setMyInterests] = useState<Interest[]>([]);
  const { exportedMoonshots, loading: loadingExported } = useExportedMoonshots();
  const [loadingMoonshots, setLoadingMoonshots] = useState(true);
  const [loadingInterests, setLoadingInterests] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userPubkey) {
        setLoadingMoonshots(false);
        setLoadingInterests(false);
        return;
      }

      try {
        const creatorMoonshots = await fetchAllMoonshotsByCreator(userPubkey);
        setMyMoonshots(creatorMoonshots);
      } catch (error) {
        console.error("Failed to fetch moonshots:", error);
      } finally {
        setLoadingMoonshots(false);
      }

      try {
        const interests = await fetchUserInterests(userPubkey);
        setMyInterests(interests);
      } catch (error) {
        console.error("Failed to fetch interests:", error);
      } finally {
        setLoadingInterests(false);
      }
    };

    fetchData();
  }, [userPubkey]);

  if (!userPubkey) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="rounded-2xl border border-white/10 bg-card/80 px-6 py-8 text-center max-w-md w-full">
          <p className="text-gray-300 text-sm sm:text-base mb-4">
            Please connect your Nostr identity to view your dashboard.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center justify-center rounded-full bg-bitcoin px-6 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-wide text-black hover:bg-orange-400 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Your <span className="text-bitcoin">Dashboard</span>
            </h1>
          </div>
          <div className="flex gap-2 text-xs text-gray-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Created: <span className="text-bitcoin font-semibold">{myMoonshots.length}</span>
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Interested: <span className="text-nostr font-semibold">{myInterests.length}</span>
            </span>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          <div className="rounded-2xl border border-white/10 bg-card/80 p-4 sm:p-6">
            <CreatorMoonshotsSection
              moonshots={myMoonshots}
              exportedMoonshots={exportedMoonshots}
              loading={loadingMoonshots || loadingExported}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-card/80 p-4 sm:p-6">
            <InterestedMoonshotsSection interests={myInterests} loading={loadingInterests} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
