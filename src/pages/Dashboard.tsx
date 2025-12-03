import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import CreatorMoonshotsSection from "../components/CreatorMoonshotsSection";
import InterestedMoonshotsSection from "../components/InterestedMoonshotsSection";
import type { Moonshot, Interest } from "../types/types";
import { fetchAllMoonshots, fetchUserInterests } from "../utils/nostr";

function Dashboard() {
  const { userPubkey } = useAuth();
  const [myMoonshots, setMyMoonshots] = useState<Moonshot[]>([]);
  const [myInterests, setMyInterests] = useState<Interest[]>([]);
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
        // Fetch moonshots created by user
        const allMoonshots = await fetchAllMoonshots();
        const userMoonshots = allMoonshots.filter(m => m.creatorPubkey === userPubkey && m.isExplorable); // temp fix(isExplorable), need to refactor 
        setMyMoonshots(userMoonshots);
      } catch (error) {
        console.error("Failed to fetch moonshots:", error);
      } finally {
        setLoadingMoonshots(false);
      }

      try {
        // Fetch interests (applications) by user
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
      <div className="min-h-screen bg-blackish flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Please connect your wallet to view dashboard</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-3 font-semibold uppercase transition-colors rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blackish py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-white mb-12">
          Your <span className="text-sky-400">Dashboard</span>
        </h1>

        {/* Section 1: Moonshots You Created */}
        <CreatorMoonshotsSection moonshots={myMoonshots} loading={loadingMoonshots} />

        {/* Section 2: Moonshots You're Interested In */}
        <InterestedMoonshotsSection interests={myInterests} loading={loadingInterests} />
      </div>
    </div>
  );
}

export default Dashboard;
