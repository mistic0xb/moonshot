import { useState } from "react";
import MoonshotCard from "./MoonshotCard";
import MoonshotDetailView from "./MoonshotDetailView";
import type { Moonshot } from "../../types/types";

interface CreatorMoonshotsSectionProps {
  moonshots: Moonshot[];
  loading: boolean;
}

function CreatorMoonshotsSection({ moonshots, loading }: CreatorMoonshotsSectionProps) {
  const [selectedMoonshot, setSelectedMoonshot] = useState<Moonshot | null>(null);

  if (selectedMoonshot) {
    return (
      <MoonshotDetailView moonshot={selectedMoonshot} onBack={() => setSelectedMoonshot(null)} />
    );
  }

  return (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">
          Your <span className="text-sky-400">Moonshots</span>
        </h2>
        <button
          onClick={() => (window.location.href = "/create")}
          className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 font-semibold uppercase transition-colors rounded"
        >
          + Create Moonshot
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-sky-600/20 border-t-sky-600 animate-spin"></div>
          <p className="text-sky-400">Loading your moonshots...</p>
        </div>
      ) : moonshots.length === 0 ? (
        <div className="card-style p-12 text-center">
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
          {moonshots.map(moonshot => (
            <MoonshotCard
              key={moonshot.id}
              moonshot={moonshot}
              onClick={() => setSelectedMoonshot(moonshot)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CreatorMoonshotsSection;
