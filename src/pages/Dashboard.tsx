// ============================================
// FILE: src/pages/Dashboard.tsx (Updated)
// ============================================

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import MoonshotCard from "../components/MoonshotCard";
import MoonshotDetailView from "../components/MoonshotDetailView";
import type { Moonshot } from "../types/types";
import { fetchAllMoonshots } from "../utils/nostr";

function Dashboard() {
  const { userPubkey } = useAuth();
  const [myMoonshots, setMyMoonshots] = useState<Moonshot[]>([]);
  const [selectedMoonshot, setSelectedMoonshot] = useState<Moonshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all moonshots and filter by creator
        const allMoonshots = await fetchAllMoonshots();
        
        if (userPubkey) {
          const userMoonshots = allMoonshots.filter(
            m => m.creatorPubkey === userPubkey
          );
          setMyMoonshots(userMoonshots);
        }
      } catch (error) {
        console.error("Failed to fetch moonshots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userPubkey]);

  const handleMoonshotClick = (moonshot: Moonshot) => {
    setSelectedMoonshot(moonshot);
  };

  const handleBack = () => {
    setSelectedMoonshot(null);
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

  // Show detail view if moonshot selected
  if (selectedMoonshot) {
    return <MoonshotDetailView moonshot={selectedMoonshot} onBack={handleBack} />;
  }

  // Show moonshot cards grid
  return (
    <div className="min-h-screen bg-blackish py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-bold text-white">
            Your <span className="text-sky-400">Dashboard</span>
          </h1>
          <button
            onClick={() => (window.location.href = "/create")}
            className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 font-semibold uppercase transition-colors rounded"
          >
            + Create Moonshot
          </button>
        </div>

        {myMoonshots.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">You haven't created any moonshots yet</p>
            <button
              onClick={() => (window.location.href = "/create")}
              className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-3 font-semibold uppercase transition-colors rounded"
            >
              Create Your First Moonshot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myMoonshots.map(moonshot => (
              <MoonshotCard
                key={moonshot.id}
                moonshot={moonshot}
                onClick={() => handleMoonshotClick(moonshot)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

