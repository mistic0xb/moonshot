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
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white">Your Moonshots</h2>
          <p className="text-xs text-gray-500">Drafts and live projects you have published.</p>
        </div>
        <button
          onClick={() => (window.location.href = "/create")}
          className="inline-flex items-center justify-center rounded-full bg-bitcoin px-5 py-2 text-xs sm:text-sm font-semibold uppercase tracking-wide text-black hover:bg-orange-400 transition-colors"
        >
          + Create Moonshot
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-white/20 border-t-bitcoin animate-spin" />
          <p className="text-xs text-gray-400">Loading your moonshots…</p>
        </div>
      ) : moonshots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/40 px-6 py-10 text-center">
          <p className="mb-3 text-sm text-gray-300">You have not created any moonshots yet.</p>
          <button
            onClick={() => (window.location.href = "/create")}
            className="inline-flex items-center justify-center rounded-full bg-bitcoin px-6 py-2 text-xs sm:text-sm font-semibold uppercase tracking-wide text-black hover:bg-orange-400 transition-colors"
          >
            Create Your First Moonshot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {moonshots.map(moonshot => (
            <MoonshotCard
              key={moonshot.id}
              moonshot={moonshot}
              onClick={() => setSelectedMoonshot(moonshot)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default CreatorMoonshotsSection;
