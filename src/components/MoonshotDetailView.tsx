import { useState, useEffect } from "react";
import { BsArrowLeft, BsPencil, BsTrash2 } from "react-icons/bs";
import { FiHeart } from "react-icons/fi";
import BuilderInfoCard from "./BuilderInfoCard";
import type { Moonshot, Interest } from "../types/types";
import { fetchInterests, fetchUpvoteCount, updateMoonshot, removeMoonshot } from "../utils/nostr";
import EditMoonshotDialog from "./EditMoonshotDialog";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import ShareButton from "./ShareButton";

interface MoonshotDetailViewProps {
  moonshot: Moonshot;
  onBack: () => void;
  onMoonshotUpdate?: (updatedMoonshot: Moonshot) => void;
  onMoonshotDeleted?: () => void;
}

function MoonshotDetailView({
  moonshot,
  onBack,
  onMoonshotUpdate,
  onMoonshotDeleted,
}: MoonshotDetailViewProps) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentMoonshot, setCurrentMoonshot] = useState<Moonshot>(moonshot);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch interests and upvotes
        const [fetchedInterests, upvotes] = await Promise.all([
          fetchInterests(currentMoonshot.id),
          fetchUpvoteCount(currentMoonshot.eventId),
        ]);
        console.log("Interests:", fetchedInterests);

        setInterests(fetchedInterests);
        setUpvoteCount(upvotes);
      } catch (error) {
        console.error("Failed to load moonshot data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentMoonshot.id, currentMoonshot.eventId]);

  const handleEditMoonshot = async (updatedData: {
    title: string;
    content: string;
    budget: string;
    timeline: string;
    topics: string[];
    status: string;
  }) => {
    try {
      // Update the moonshot event - pass the original event ID
      await updateMoonshot(
        currentMoonshot.id,
        updatedData.title,
        updatedData.content,
        updatedData.budget,
        updatedData.timeline,
        updatedData.topics,
        updatedData.status
      );

      // Update local state
      const updatedMoonshot = {
        ...currentMoonshot,
        ...updatedData,
      };
      setCurrentMoonshot(updatedMoonshot);

      // Notify parent component if needed
      if (onMoonshotUpdate) {
        onMoonshotUpdate(updatedMoonshot);
      }

      setShowEditDialog(false);
      alert("Moonshot updated successfully!");
    } catch (error) {
      console.error("Failed to update moonshot:", error);
      alert("Failed to update moonshot. Please try again.");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await removeMoonshot(currentMoonshot);
      setShowDeleteDialog(false);

      // Call the callback and go back
      if (onMoonshotDeleted) {
        onMoonshotDeleted();
      }
      onBack();
    } catch (error) {
      console.error("Failed to delete moonshot:", error);
      alert("Failed to delete moonshot. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-blackish py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Back Button */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors"
            >
              <BsArrowLeft className="text-xl" />
              <span className="font-semibold">Back to Dashboard</span>
            </button>

            {/* Edit and Delete Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditDialog(true)}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <BsPencil className="text-lg" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <BsTrash2 size={18} />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {/* Moonshot Overview Card */}
          <div className="card-style p-8 mb-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl font-bold text-white">{currentMoonshot.title}</h1>
              <div className="flex items-center gap-2 text-red-400">
                <ShareButton moonshot={moonshot} />
                <FiHeart className="text-2xl" />
                <span className="text-xl font-semibold">{upvoteCount}</span>
              </div>
            </div>

            {/* Topics */}
            {currentMoonshot.topics && currentMoonshot.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {currentMoonshot.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-sky-900/20 border border-sky-500/30 text-sky-300 text-sm rounded-full"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blackish border border-sky-500/30 p-4 rounded">
                <p className="text-gray-400 text-sm mb-1">Budget</p>
                <p className="text-sky-300 text-xl font-bold">{currentMoonshot.budget} sats</p>
              </div>
              <div className="bg-blackish border border-sky-500/30 p-4 rounded">
                <p className="text-gray-400 text-sm mb-1">Timeline</p>
                <p className="text-sky-300 text-xl font-bold">{currentMoonshot.timeline} months</p>
              </div>
              <div className="bg-blackish border border-sky-500/30 p-4 rounded">
                <p className="text-gray-400 text-sm mb-1">Status</p>
                <p
                  className={`text-xl font-bold ${
                    currentMoonshot.status === "open"
                      ? "text-green-400"
                      : currentMoonshot.status === "assigned"
                      ? "text-yellow-400"
                      : currentMoonshot.status === "in-progress"
                      ? "text-blue-400"
                      : currentMoonshot.status === "completed"
                      ? "text-purple-400"
                      : "text-gray-400"
                  }`}
                >
                  {currentMoonshot.status}
                </p>
              </div>
              <div className="bg-blackish border border-sky-500/30 p-4 rounded">
                <p className="text-gray-400 text-sm mb-1">Interested</p>
                <p className="text-sky-300 text-xl font-bold">{interests.length}</p>
              </div>
            </div>

            {/* Content Preview */}
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 whitespace-pre-wrap">
                {currentMoonshot.content.substring(0, 200)}...
              </div>
            </div>
          </div>

          {/* Interested Builders Section */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">
              Interested Builders ({interests.length})
            </h2>

            {loading ? (
              <div className="card-style p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-sky-600/20 border-t-sky-600 animate-spin"></div>
                <p className="text-gray-400">Loading builders...</p>
              </div>
            ) : interests.length === 0 ? (
              <div className="card-style p-8 text-center">
                <p className="text-gray-400 text-lg">No builders have shown interest yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  Share your moonshot to attract builders!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {interests.map(interest => (
                  <BuilderInfoCard key={interest.id} interest={interest} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Moonshot Dialog */}
      {showEditDialog && (
        <EditMoonshotDialog
          moonshot={currentMoonshot}
          onSubmit={handleEditMoonshot}
          onClose={() => setShowEditDialog(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <DeleteConfirmationDialog
          moonshotTitle={currentMoonshot.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}

export default MoonshotDetailView;
