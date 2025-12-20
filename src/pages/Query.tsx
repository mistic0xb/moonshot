import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { BsPencilSquare } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";
import type { ProofOfWorkLink, UserProfile } from "../types/types";
import RichTextViewer from "../components/richtext/RichTextViewer";
import ShareButton from "../components/moonshots/ShareButton";
import UpvoteButton from "../components/moonshots/UpvoteButton";
import InterestDialog from "../components/interests/InterestDialog";
import MoonshotVersionHistory from "../components/moonshots/MoonshotVersionHistory";
import CommentSection from "../components/comments/CommentSection";
import {
  fetchMoonshotById,
  publishInterest,
  fetchInterests,
  fetchUserProfile,
  fetchMoonshotVersions,
  fetchComments,
} from "../utils/nostr";
import { useToast } from "../context/ToastContext";

function Query() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, userPubkey } = useAuth();
  const { showToast } = useToast();

  const [showInterestDialog, setShowInterestDialog] = useState(false);

  // Fetch moonshot
  const moonshotQuery = useQuery({
    queryKey: ["moonshot", id],
    queryFn: () => fetchMoonshotById(id!),
    enabled: !!id,
  });

  const moonshot = moonshotQuery.data;

  // Fetch interests
  const interestsQuery = useQuery({
    queryKey: ["interests", moonshot?.id, moonshot?.creatorPubkey],
    queryFn: () => fetchInterests(moonshot!.id, moonshot!.creatorPubkey),
    enabled: !!moonshot,
  });

  // Fetch comments
  const commentsQuery = useQuery({
    queryKey: ["comments", moonshot?.id, moonshot?.creatorPubkey],
    queryFn: () => fetchComments(moonshot!.creatorPubkey, moonshot!.id),
    enabled: !!moonshot,
  });

  // Fetch versions
  const versionsQuery = useQuery({
    queryKey: ["versions", moonshot?.id, moonshot?.creatorPubkey],
    queryFn: () => fetchMoonshotVersions(moonshot!.id, moonshot!.creatorPubkey),
    enabled: !!moonshot,
  });

  // Fetch user profiles for interested builders
  const interests = interestsQuery.data ?? [];
  const uniqueBuilders = interests.map(i => i.builderPubkey);

  const userProfilesQuery = useQuery({
    queryKey: ["builder-profiles", uniqueBuilders],
    queryFn: async () => {
      if (interests.length === 0) return new Map<string, UserProfile>();

      const profilePromises = interests.map(interest =>
        fetchUserProfile(interest.builderPubkey).catch(err => {
          console.error(`Failed to fetch profile for ${interest.builderPubkey}:`, err);
          return null;
        })
      );
      const profiles = await Promise.all(profilePromises);

      const profileMap = new Map<string, UserProfile>();
      profiles.forEach((profile, index) => {
        if (profile) {
          profileMap.set(interests[index].builderPubkey, profile);
        }
      });

      return profileMap;
    },
    enabled: interests.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleInterestClick = () => {
    if (!isAuthenticated) {
      document.dispatchEvent(new CustomEvent("nlLaunch", { detail: "welcome-login" }));
    } else if (userPubkey && interests.some(i => i.builderPubkey === userPubkey)) {
      showToast("You have already shown interest.", "info");
    } else {
      setShowInterestDialog(true);
    }
  };

  async function handleInterestSubmit(
    message: string,
    github?: string,
    proofOfWorkLinks?: ProofOfWorkLink[]
  ) {
    if (!moonshot) return;

    try {
      await publishInterest(
        moonshot.id,
        moonshot.eventId,
        moonshot.creatorPubkey,
        message,
        github,
        proofOfWorkLinks
      );

      setShowInterestDialog(false);
      showToast("Interest submitted successfully!", "success");

      // Refetch interests and profiles
      await interestsQuery.refetch();
      await userProfilesQuery.refetch();
    } catch (error) {
      console.error("Failed to submit interest:", error);
      showToast("Failed to submit interest. Please try again", "error");
    }
  }

  if (moonshotQuery.isPending) {
    return <SkeletonLayout />;
  }

  if (moonshotQuery.isError || !moonshot) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Moonshot Not Found</h2>
          <p className="text-gray-400">The moonshot you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const comments = commentsQuery.data ?? [];
  const versions = versionsQuery.data ?? [];
  const userProfiles = userProfilesQuery.data ?? new Map<string, UserProfile>();
  const loadingInterests = interestsQuery.isPending;
  const loadingVersions = versionsQuery.isPending;

  return (
    <>
      <div className="min-h-screen bg-dark pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card/70 border border-white/5 rounded-2xl p-6 sm:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                        {moonshot.title}
                      </h1>
                      {versions.length > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs rounded-full">
                          <BsPencilSquare className="text-xs" />
                          Edited
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <ShareButton moonshot={moonshot} />
                    <UpvoteButton moonshotId={moonshot.id} creatorPubkey={moonshot.creatorPubkey} />
                  </div>
                </div>

                {/* Topics */}
                {moonshot.topics && moonshot.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {moonshot.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white/5 border border-white/10 text-gray-200 text-xs rounded-full"
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-3 mb-6 text-sm">
                  <span className="px-4 py-2 bg-white/5 border border-white/10 text-gray-200 font-semibold rounded-full">
                    {moonshot.budget} sats
                  </span>
                  <span
                    className={`px-4 py-2 rounded-full border text-sm font-semibold ${
                      moonshot.status === "open"
                        ? "bg-green-500/10 border-green-500/40 text-green-300"
                        : moonshot.status === "closed"
                        ? "bg-red-500/10 border-red-500/40 text-red-300"
                        : "bg-white/5 border-white/10 text-gray-300"
                    }`}
                  >
                    {moonshot.status}
                  </span>
                </div>

                {/* Content */}
                <div className="mb-8 prose prose-invert max-w-none">
                  <RichTextViewer content={moonshot.content} />
                </div>

                <button
                  onClick={handleInterestClick}
                  disabled={!!userPubkey && interests.some(i => i.builderPubkey === userPubkey)}
                  className={`w-full  font-semibold py-3 sm:py-4 text-sm sm:text-base uppercase tracking-wide rounded-full transition-all duration-300  ${
                    userPubkey && interests.some(i => i.builderPubkey === userPubkey)
                      ? "border-bitcoin border text-bitcoin disabled:cursor-not-allowed"
                      : "bg-bitcoin hover:bg-orange-400 text-black cursor-pointer hover:shadow-[0_0_18px_rgba(247,147,26,0.4)] "
                  }`}
                >
                  {isAuthenticated
                    ? userPubkey && interests.some(i => i.builderPubkey === userPubkey)
                      ? "Already Interested"
                      : "I'm interested"
                    : "Login to Show Interest"}
                </button>
              </div>

              {/* Comments */}
              <CommentSection
                moonshotId={moonshot.id}
                moonshotCreatorPubkey={moonshot.creatorPubkey}
                isAuthenticated={isAuthenticated}
                fetchedComments={comments}
                onCommentAdded={() => commentsQuery.refetch()}
              />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1">
              <div className="bg-card/70 border border-white/5 rounded-2xl p-6 space-y-6 lg:sticky lg:top-24">
                <div className=" scrollbar-thin">
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                    Interested Builders ({interests.length})
                  </h2>

                  {loadingInterests ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-12 bg-white/5 rounded-xl" />
                      <div className="h-12 bg-white/5 rounded-xl" />
                      <div className="h-12 bg-white/5 rounded-xl" />
                    </div>
                  ) : interests.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                      <p className="text-gray-400 mb-1">No builders yet.</p>
                      <p className="text-gray-500 text-xs">Be the first to show interest.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                      {interests.map(interest => {
                        const profile = userProfiles.get(interest.builderPubkey);
                        return (
                          <div
                            key={interest.id}
                            className="bg-white/5 border border-white/10 p-4 rounded-xl"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              {profile?.picture ? (
                                <img
                                  src={profile.picture}
                                  alt={profile.name || "Builder"}
                                  className="w-9 h-9 rounded-full border border-white/10 object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-linear-to-tr from-bitcoin to-nostr flex items-center justify-center text-xs font-bold text-white">
                                  {interest.builderPubkey.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-200 text-sm font-medium truncate">
                                  {profile?.name || `${interest.builderPubkey.slice(0, 8)}...`}
                                </p>
                                {interest.github && (
                                  <p className="text-gray-500 text-xs truncate">
                                    GitHub: {interest.github}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-300 text-xs sm:text-sm line-clamp-3 mb-1">
                              {interest.message}
                            </p>
                            {interest.proofOfWorkLinks.length > 0 && (
                              <p className="text-gray-500 text-xs">
                                +{interest.proofOfWorkLinks.length} proof
                                {interest.proofOfWorkLinks.length > 1 && "s"} of work
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <MoonshotVersionHistory versions={versions} loading={loadingVersions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInterestDialog && isAuthenticated && moonshot && (
        <InterestDialog
          moonshotEventId={moonshot.eventId}
          onSubmit={handleInterestSubmit}
          onClose={() => setShowInterestDialog(false)}
        />
      )}
    </>
  );
}

export default Query;

function SkeletonLayout() {
  return (
    <div className="min-h-screen bg-dark pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left skeleton */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card/60 border border-white/5 rounded-2xl p-6 animate-pulse">
              <div className="h-7 w-1/2 bg-white/10 rounded mb-4" />
              <div className="h-4 w-1/4 bg-white/5 rounded mb-2" />
              <div className="h-4 w-full bg-white/5 rounded mb-2" />
              <div className="h-4 w-5/6 bg-white/5 rounded mb-2" />
              <div className="h-4 w-2/3 bg-white/5 rounded mb-4" />
              <div className="h-10 w-full bg-white/5 rounded" />
            </div>
            <div className="bg-card/40 border border-white/5 rounded-2xl h-56 animate-pulse" />
          </div>

          {/* Right skeleton */}
          <div className="bg-card/60 border border-white/5 rounded-2xl p-6 animate-pulse">
            <div className="h-5 w-40 bg-white/10 rounded mb-6" />
            <div className="space-y-4">
              <div className="h-12 bg-white/5 rounded" />
              <div className="h-12 bg-white/5 rounded" />
              <div className="h-12 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
