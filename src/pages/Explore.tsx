import { useNavigate } from "react-router";
import MoonshotCard from "../components/moonshots/MoonshotCard";
import { fetchAllMoonshots } from "../utils/nostr";
import { useExportedMoonshots } from "../context/ExportedMoonshotContext";
import { useQuery } from "@tanstack/react-query";

function Explore() {
  const navigate = useNavigate();
  const { isExported } = useExportedMoonshots();

  const {
    isPending,
    isError,
    data,
    error: err,
  } = useQuery({
    queryKey: ['all-moonshots'],
    queryFn: fetchAllMoonshots,
  });

  if (isPending) {
    return (
      <div className="min-h-screen bg-dark pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Explore <span className="gradient-text">Moonshots</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Loading moonshots...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    console.log("ERROR:", err);
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Error fetching moonshots.</p>
          <p className="text-gray-500 text-sm">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  const moonshots = data.filter(moonshot => moonshot?.isExplorable !== false);

  return (
    <div className="min-h-screen bg-dark pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Explore <span className="gradient-text">Moonshots</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto">
            Find something you can build? show interest and get em sats!
          </p>
        </div>

        {/* Content */}
        {moonshots.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">No moonshots found yet.</p>
            <button
              onClick={() => navigate("/create")}
              className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-bitcoin hover:bg-orange-400 text-black font-semibold text-sm uppercase tracking-wide transition-colors"
            >
              Create First Moonshot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {moonshots.map(moonshot => {
              const exported = isExported(moonshot.eventId);
              return (
                <MoonshotCard
                  key={moonshot.id}
                  moonshot={moonshot}
                  isExported={exported}
                  onClick={() => navigate(`/moonshot/${moonshot.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;