import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { BsArrowLeft, BsPencil, BsTrash2, BsPencilSquare, BsChevronDown } from "react-icons/bs";
import { FiHeart } from "react-icons/fi";
import BuilderInfoCard from "./../builder/BuilderInfoCard";
import type {
  Moonshot,
  Interest,
  Comment,
  UserProfile,
} from "../../types/types";
import {
  fetchInterests,
  fetchUpvoteCount,
  updateMoonshot,
  removeMoonshot,
  fetchMoonshotVersions,
  fetchComments,
  calculateTotalChipIn,
  fetchUserProfile,
} from "../../utils/nostr";
import EditMoonshotDialog from "./EditMoonshotDialog";
import ShareButton from "./ShareButton";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import MoonshotVersionHistory from "./MoonshotVersionHistory";
import CommentSection from "../comments/CommentSection";
import SelectBuilderConfirmDialog from "./SelectBuilderConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { useExportedMoonshots } from "../../context/ExportedMoonshotContext";

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
  const navigate = useNavigate();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [versions, setVersions] = useState<Moonshot[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [totalChipIn, setTotalChipIn] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentMoonshot, setCurrentMoonshot] = useState<Moonshot>(moonshot);
  const [showBuilderDropdown, setShowBuilderDropdown] = useState(false);
  const [selectedBuilder, setSelectedBuilder] = useState<UserProfile | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [interestedUsersMetadata, setInterestedUserMetadata] = useState<UserProfile[]>([]);
  const { getExportStatus } = useExportedMoonshots();
  const exportedStatus = getExportStatus(currentMoonshot.eventId);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedInterests, upvotes, fetchedVersions, fetchedComments] = await Promise.all([
          fetchInterests(currentMoonshot.id, currentMoonshot.creatorPubkey),
          fetchUpvoteCount(currentMoonshot.id, currentMoonshot.creatorPubkey),
          fetchMoonshotVersions(currentMoonshot.id, currentMoonshot.creatorPubkey),
          fetchComments(currentMoonshot.creatorPubkey, currentMoonshot.id),
        ]);
        console.log("Interests:", fetchedInterests);
        console.log("Versions:", fetchedVersions);
        console.log("comments:", fetchedComments);

        setInterests(fetchedInterests);
        setUpvoteCount(upvotes);
        setVersions(fetchedVersions);
        setComments(fetchedComments);
        setTotalChipIn(calculateTotalChipIn(fetchedComments));
        setLoadingVersions(false);
      } catch (error) {
        console.error("Failed to load moonshot data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentMoonshot.creatorPubkey, currentMoonshot.id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await Promise.all(
          interests.map(async interest => {
            const profile = await fetchUserProfile(interest.builderPubkey);
            if (!profile) throw new Error("Profile not found");
            return profile;
          })
        );

        setInterestedUserMetadata(data);
      } catch (error) {
        console.log(`ERR: fetchingUserProfile: ${error}`);
      }
    };
    loadData();
  }, [interests]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBuilderDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditMoonshot = async (updatedData: {
    title: string;
    content: string;
    budget: string;
    timeline: string;
    topics: string[];
    status: string;
  }) => {
    try {
      await updateMoonshot(
        currentMoonshot.id,
        currentMoonshot.creatorPubkey,
        currentMoonshot.eventId,
        currentMoonshot.title,
        currentMoonshot.content,
        currentMoonshot.budget,
        currentMoonshot.timeline,
        currentMoonshot.topics,
        currentMoonshot.status,
        currentMoonshot.createdAt,
        updatedData.title,
        updatedData.content,
        updatedData.budget,
        updatedData.timeline,
        updatedData.topics,
        updatedData.status
      );

      const updatedMoonshot = {
        ...currentMoonshot,
        ...updatedData,
      };
      setCurrentMoonshot(updatedMoonshot);

      const fetchedVersions = await fetchMoonshotVersions(
        currentMoonshot.id,
        currentMoonshot.creatorPubkey
      );
      setVersions(fetchedVersions);

      if (onMoonshotUpdate) {
        onMoonshotUpdate(updatedMoonshot);
      }

      setShowEditDialog(false);
      showToast("Moonshot updated successfully!", "success");
    } catch (error) {
      console.error("Failed to update moonshot:", error);
      showToast("Failed to update moonshot. Please try again", "error");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await removeMoonshot(currentMoonshot);
      setShowDeleteDialog(false);

      if (onMoonshotDeleted) {
        onMoonshotDeleted();
      }
      onBack();
    } catch (error) {
      console.error("Failed to delete moonshot:", error);
      showToast("Failed to delete moonshot. Please try again", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectBuilder = (builder: UserProfile) => {
    setSelectedBuilder(builder);
    setShowBuilderDropdown(false);
    setShowConfirmDialog(true);
  };

  const handleConfirmBuilderSelection = () => {
    if (selectedBuilder) {
      // Navigate to create angor project page with builder info
      navigate("/create-angor-project", {
        state: {
          moonshot: currentMoonshot,
          selectedBuilder: selectedBuilder,
        },
      });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-dark pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back + actions */}
          <div className="mb-5 flex flex-row gap-3 items-center justify-between">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <BsArrowLeft className="text-sm" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEditDialog(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <BsPencil size={14} />
                <span className="sm:block hidden">Edit</span>
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex items-center gap-2 rounded-full bg-red-500/90 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-400 transition-colors cursor-pointer"
              >
                <BsTrash2 size={14} />
                <span className="sm:block hidden">Remove</span>
              </button>
            </div>
          </div>

          {/* Overview */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-card/80 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  {currentMoonshot.title}
                </h1>
                {versions.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-200 border border-white/15">
                    <BsPencilSquare className="text-[10px]" />
                    Edited
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <ShareButton moonshot={moonshot} />

                {/* Select Builder Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowBuilderDropdown(!showBuilderDropdown)}
                    disabled={interests.length === 0 || exportedStatus?.isExported}
                    className={`inline-flex items-center gap-1.5 rounded-full bg-bitcoin/90 px-3 py-1.5 text-xs font-medium text-black transition-colors ${
                      (interests.length === 0 || exportedStatus?.isExported)
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-bitcoin cursor-pointer"
                    }`}
                  >
                    <span>Select Builder</span>
                    <BsChevronDown
                      className={`text-xs transition-transform ${
                        showBuilderDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showBuilderDropdown && interests.length > 0 && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-card shadow-xl z-10 max-h-80 overflow-y-auto">
                      {interestedUsersMetadata.map(profile => (
                        <button
                          key={profile.pubkey}
                          onClick={() => handleSelectBuilder(profile)}
                          className="w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-white/5"
                        >
                          <BuilderListDropDownCard userProfile={profile} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                  <FiHeart className="text-red-400 text-sm" />
                  <span className="font-semibold">{upvoteCount}</span>
                </div>
              </div>
            </div>

            {/* Topics */}
            {currentMoonshot.topics && currentMoonshot.topics.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {currentMoonshot.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-gray-200"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
                <p className="mb-0.5 text-[11px] text-gray-500">Budget</p>
                <p className="text-sm font-semibold text-bitcoin">{currentMoonshot.budget} sats</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
                <p className="mb-0.5 text-[11px] text-gray-500">Timeline</p>
                <p className="text-sm font-semibold text-gray-200">
                  {currentMoonshot.timeline} months
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
                <p className="mb-0.5 text-[11px] text-gray-500">Status</p>
                <p
                  className={`text-sm font-semibold ${
                    currentMoonshot.status === "open"
                      ? "text-green-400"
                      : currentMoonshot.status === "assigned"
                      ? "text-yellow-300"
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
              <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
                <p className="mb-0.5 text-[11px] text-gray-500">Interested</p>
                <p className="text-sm font-semibold text-gray-200">{interests.length}</p>
              </div>
              <div className="rounded-xl border border-amber-400/40 bg-black/40 px-3 py-2.5">
                <p className="mb-0.5 text-[11px] text-gray-500">Expected Chip‑in</p>
                <p className="text-sm font-semibold text-amber-300">
                  {totalChipIn > 0 ? `${totalChipIn.toLocaleString()} sats` : "0 sats"}
                </p>
              </div>
            </div>

            {/* Short preview */}
            <div className="text-[13px] text-gray-300 line-clamp-4 whitespace-pre-wrap">
              {currentMoonshot.content}
            </div>
          </div>

          {exportedStatus?.isExported && (
            <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
              This project has been exported to Angor
              <div className="text-amber-400/80">eventId: {exportedStatus.exportEventId}</div>
            </div>
          )}

          {/* Version history */}
          <MoonshotVersionHistory versions={versions} loading={loadingVersions} />

          {/* Comments */}
          <CommentSection
            moonshotId={moonshot.id}
            moonshotCreatorPubkey={moonshot.creatorPubkey}
            isAuthenticated={true}
            isCollapsed={true}
            fetchedComments={comments}
          />

          {/* Interested builders */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg sm:text-xl font-semibold text-white">
              Interested Builders ({interests.length})
            </h2>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-card/80 px-6 py-6 text-center text-sm text-gray-300">
                <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-white/20 border-t-bitcoin animate-spin" />
                Loading builders…
              </div>
            ) : interests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/40 px-6 py-6 text-center text-sm text-gray-300">
                <p>No builders have shown interest yet.</p>
                <p className="mt-1 text-xs text-gray-500">
                  Share your moonshot to attract builders.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {interests.map(interest => (
                  <BuilderInfoCard key={interest.id} interest={interest} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs  */}
      {showEditDialog && (
        <EditMoonshotDialog
          moonshot={currentMoonshot}
          onSubmit={handleEditMoonshot}
          onClose={() => setShowEditDialog(false)}
        />
      )}
      {showDeleteDialog && (
        <DeleteConfirmationDialog
          moonshotTitle={currentMoonshot.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
          isDeleting={isDeleting}
        />
      )}
      {showConfirmDialog && selectedBuilder && (
        <SelectBuilderConfirmDialog
          builder={selectedBuilder}
          onConfirm={handleConfirmBuilderSelection}
          onCancel={() => {
            setShowConfirmDialog(false);
            setSelectedBuilder(null);
          }}
        />
      )}
    </>
  );
}

interface BuilderListDropDownCardProp {
  userProfile: UserProfile;
}

function BuilderListDropDownCard({ userProfile }: BuilderListDropDownCardProp) {
  return (
    <>
      <div className="flex justify-center items-center gap-3">
        <img
          src={userProfile?.picture}
          className="w-10 h-10 sm:w-8 sm:h-8 rounded-full border-2 border-bitcoin/30 object-cover shrink-0"
        />
        <p className="text-lg">{userProfile?.name}</p>
      </div>
    </>
  );
}

export default MoonshotDetailView;
